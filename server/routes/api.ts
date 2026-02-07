
import express from 'express';
import multer from 'multer';
import { processDocument, extractFinancials } from '../services/ocr';
import { calculateEligibilityScore } from '../services/scoring';
import { matchLenders } from '../services/lender_matcher';
import { supabase } from '../db';
import { memoryStore } from '../store/memory';

const router = express.Router();

// Use in-memory store when DB connection fails (ETIMEDOUT, etc.) for local dev
let useMemoryStore = false;
let hasLoggedFallback = false;
const logFallbackOnce = (context: string) => {
  if (!hasLoggedFallback) {
    hasLoggedFallback = true;
    console.warn('[DB] Connection failed, switching to in-memory store for applications. (Step 1 creates with loan_type only; nulls for other fields are expected.)');
  }
};
const isDbConnectionError = (err: unknown) => {
  const e = err as { code?: string; message?: string; errors?: Array<{ code?: string }> };
  const code = e?.code;
  const message = e?.message || '';
  const innerCodes = (e?.errors || []).map((x) => x?.code);
  return (
    code === 'ETIMEDOUT' ||
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    message.includes('ETIMEDOUT') ||
    innerCodes.some((c) => c === 'ETIMEDOUT' || c === 'ECONNREFUSED')
  );
};
const upload = multer({ storage: multer.memoryStorage() });

// 1. Upload & Process
router.post('/upload-documents', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        const { applicationId } = req.body;

        if (!file) return res.status(400).json({ error: 'No file uploaded' });

        // A. OCR
        // Pass buffer if available (memory storage), else path
        const ocrResult = await processDocument(file.buffer || file.path, file.mimetype);

        // B. Extract Financials
        const financials = extractFinancials(ocrResult.text);

        // C. Save to DB using pg pool
        await import('../db').then(m => m.pool.query(`
            INSERT INTO public.financial_data (
                application_id, average_monthly_revenue, average_balance, 
                total_revenue_last_6m, inflow_outflow_ratio, 
                revenue_consistency_score, cash_flow_volatility_score, 
                avg_transaction_count
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            applicationId,
            financials.average_monthly_revenue,
            financials.average_balance,
            financials.total_revenue_last_6m,
            financials.inflow_outflow_ratio,
            financials.revenue_consistency_score,
            financials.cash_flow_volatility_score,
            financials.avg_transaction_count
        ]));

        res.json({ success: true, financials });
    } catch (error) {
        console.error('Upload processing error:', error);
        if (error instanceof Error) console.error(error.stack);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Processing failed' });
    }
});

// 2. Calculate Score & Get Offers
router.post('/generate-offers', async (req, res) => {
    try {
        console.log('Generate Offers Request Body:', req.body);
        const { applicationId } = req.body;
        const pool = (await import('../db')).pool;

        // CHECK EXISTING OFFERS FIRST
        const { rows: existingOffers } = await pool.query(`
            SELECT o.*, l.name as lender_name 
            FROM public.offers o
            JOIN public.lenders l ON o.lender_id = l.id
            WHERE o.application_id = $1
        `, [applicationId]);

        if (existingOffers.length > 0) {
            // Fetch existing decisions
            const { rows: existingDecisions } = await pool.query(`
                SELECT * FROM public.application_decisions WHERE application_id = $1
            `, [applicationId]);

            // Fetch existing score
            const { rows: existingScore } = await pool.query(`
                SELECT * FROM public.eligibility_scores WHERE application_id = $1
            `, [applicationId]);

            // Ensure application status is at least 'requires_info' (pending) if it's 'draft'
            // This ensures it shows up on the dashboard
            await pool.query(`
                UPDATE public.loan_applications 
                SET status = 'requires_info' 
                WHERE id = $1 AND status = 'draft'
            `, [applicationId]);

            return res.json({
                score: existingScore[0] || {},
                offers: existingOffers, // This includes "status" column
                decisions: existingDecisions
            });
        }

        // Fetch financials using pg pool
        const { rows } = await pool.query(`
            SELECT * FROM public.financial_data WHERE application_id = $1
        `, [applicationId]);

        const finData = rows[0];

        if (!finData) return res.status(404).json({ error: 'Financial data not found' });

        // A. Score
        // Map back DB columns to expected interface if needed, or update scoring.ts
        // scoring.ts generally expects certain keys. Let's assume it accepts DB keys or we map.
        // Quick map:
        const finDataMapped = {
            ...finData,
            monthly_revenue: parseFloat(finData.average_monthly_revenue) // scoring might expect this
        };

        const scoreResult = calculateEligibilityScore(finDataMapped);

        // Save Score
        await pool.query(`
            INSERT INTO public.eligibility_scores (
                application_id, overall_score, breakdown, risk_flags
            ) VALUES ($1, $2, $3, $4)
        `, [
            applicationId,
            scoreResult.overall_score,
            scoreResult.breakdown, // Pass as object/JSON
            scoreResult.risk_flags // Pass as array
        ]);

        // B. Match Lenders
        const { offers, decisions } = await matchLenders(
            scoreResult.overall_score,
            Math.floor(parseFloat(finData.average_monthly_revenue)),
            applicationId
        );

        // Save Offers & Decisions
        for (const offer of offers) {
            await pool.query(`
                INSERT INTO public.offers (
                    application_id, lender_id, amount, interest_rate, tenure_months, 
                    emi, approval_chance, status, processing_fee
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
                applicationId,
                offer.lender_id,
                offer.amount,
                offer.interest_rate,
                offer.tenure_months,
                offer.emi || 0,
                offer.approval_chance || 0,
                'generated',
                offer.processing_fee || 0
            ]);
        }

        for (const decision of decisions) {
            await pool.query(`
                INSERT INTO public.application_decisions (
                    application_id, lender_id, decision, primary_reason, improvement_tips
                ) VALUES ($1, $2, $3, $4, $5)
            `, [
                applicationId,
                decision.lender_id,
                decision.decision,
                decision.primary_reason,
                decision.improvement_tips
            ]);
        }

        // UPDATE APPLICATION STATUS
        // Mark as 'requires_info' (which maps to Pending in Dashboard) so user knows they have offers to review
        await pool.query(`
            UPDATE public.loan_applications 
            SET status = 'requires_info' 
            WHERE id = $1
        `, [applicationId]);

        // Fetch back the saved offers to ensure we have the IDs and default status
        // Fetch back the saved offers to ensure we have the IDs and default status
        const { rows: savedOffers } = await pool.query(`
            SELECT o.*, l.name as lender_name 
            FROM public.offers o
            JOIN public.lenders l ON o.lender_id = l.id
            WHERE o.application_id = $1
        `, [applicationId]);

        res.json({
            score: scoreResult,
            offers: savedOffers,
            decisions
        });

    } catch (error) {
        console.error('Offer generation error:', error);
        if (error instanceof Error) console.error(error.stack);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Offer generation failed' });
    }
});

// 3. Create Application (Proxy for DB access)
router.post('/applications', async (req, res) => {
    try {
        console.log('Received application body:', req.body);
        const { user_id, loan_type, requested_amount, business_name, business_age_months, monthly_revenue, industry, status, founder_cibil_score } = req.body;

        if (!user_id || !loan_type) {
            return res.status(400).json({ error: 'user_id and loan_type are required' });
        }

        const toNum = (v: any) => (v === '' || v === undefined || v === null || Number.isNaN(Number(v))) ? null : Number(v);
        const cleanRequestedAmount = toNum(requested_amount);
        const cleanBusinessAge = toNum(business_age_months);
        const cleanMonthlyRevenue = toNum(monthly_revenue);
        const cleanFounderCibil = toNum(founder_cibil_score);

        if (useMemoryStore) {
            const { id } = memoryStore.insertApplication({
                user_id,
                loan_type: loan_type || 'working_capital',
                requested_amount: cleanRequestedAmount,
                business_name: business_name || null,
                business_age_months: cleanBusinessAge,
                monthly_revenue: cleanMonthlyRevenue,
                industry: industry || null,
                status: status || 'draft',
                founder_cibil_score: cleanFounderCibil,
            });
            return res.json({ id });
        }

        try {
            const { rows } = await import('../db').then(m => m.pool.query(`
                INSERT INTO public.loan_applications (
                    user_id, loan_type, requested_amount, business_name, 
                    business_age_months, monthly_revenue, industry, status, founder_cibil_score
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id
            `, [user_id, loan_type || 'working_capital', cleanRequestedAmount, business_name || null, cleanBusinessAge, cleanMonthlyRevenue, industry || null, status || 'draft', cleanFounderCibil]));
            res.json({ id: rows[0].id });
        } catch (dbErr) {
            if (isDbConnectionError(dbErr)) {
                useMemoryStore = true;
                logFallbackOnce('create');
                const { id } = memoryStore.insertApplication({
                    user_id,
                    loan_type: loan_type || 'working_capital',
                    requested_amount: cleanRequestedAmount,
                    business_name: business_name || null,
                    business_age_months: cleanBusinessAge,
                    monthly_revenue: cleanMonthlyRevenue,
                    industry: industry || null,
                    status: status || 'draft',
                    founder_cibil_score: cleanFounderCibil,
                });
                return res.json({ id });
            }
            throw dbErr;
        }
    } catch (error) {
        console.error('Error creating application:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown Database Error';
        res.status(500).json({ error: `Failed to create application: ${errorMessage}` });
    }
});

// 4. Get Applications
router.get('/applications', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ error: 'Missing user_id' });

        if (useMemoryStore) {
            const rows = memoryStore.getByUserId(String(user_id));
            return res.json(rows);
        }

        try {
            const { rows } = await import('../db').then(m => m.pool.query(`
                SELECT * FROM public.loan_applications 
                WHERE user_id = $1 
                ORDER BY created_at DESC
            `, [user_id]));
            res.json(rows);
        } catch (dbErr) {
            if (isDbConnectionError(dbErr)) {
                useMemoryStore = true;
                logFallbackOnce('fetch');
                const rows = memoryStore.getByUserId(String(user_id));
                return res.json(rows);
            }
            throw dbErr;
        }
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});


// 4a. Get Single Application (Bypass RLS)
router.get('/application/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (useMemoryStore) {
            const row = memoryStore.getById(id);
            if (!row) return res.status(404).json({ error: 'Application not found' });
            return res.json(row);
        }

        try {
            const { rows } = await import('../db').then(m => m.pool.query(`
                SELECT * FROM public.loan_applications 
                WHERE id = $1
            `, [id]));
            if (rows.length === 0) return res.status(404).json({ error: 'Application not found' });
            res.json(rows[0]);
        } catch (dbErr) {
            if (isDbConnectionError(dbErr)) {
                useMemoryStore = true;
                const row = memoryStore.getById(id);
                if (!row) return res.status(404).json({ error: 'Application not found' });
                return res.json(row);
            }
            throw dbErr;
        }
    } catch (error) {
        console.error('Error fetching application:', error);
        res.status(500).json({ error: 'Failed to fetch application' });
    }
});

// 5. Apply to Offer
router.post('/apply-offer', async (req, res) => {
    try {
        const { applicationId, lenderId } = req.body;

        const pool = (await import('../db')).pool;

        // Update Offer Status
        await pool.query(`
            UPDATE public.offers 
            SET status = 'accepted' 
            WHERE application_id = $1 AND lender_id = $2
        `, [applicationId, lenderId]);

        // Update Application Status to 'submitted' if not already
        await pool.query(`
            UPDATE public.loan_applications 
            SET status = 'submitted' 
            WHERE id = $1
        `, [applicationId]);

        res.json({ success: true });
    } catch (error) {
        console.error('Error applying to offer:', error);
        res.status(500).json({ error: 'Failed to apply' });
    }
});

export default router;
