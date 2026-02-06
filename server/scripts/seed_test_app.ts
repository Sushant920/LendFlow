// Seed script preserved for future testing

async function seed() {
    try {
        // 1. Get User
        // Try to find the demo user
        const { rows } = await pool.query("SELECT id FROM auth.users WHERE email = 'demo@example.com'");

        let userId;
        if (rows.length > 0) {
            userId = rows[0].id;
            console.log(`Found existing user: ${userId}`);
        } else {
            // Fallback to the one seed_user.ts uses if created
            userId = '00000000-0000-0000-0000-000000000001';
            console.log(`User not found, trying fallback ID: ${userId}`);
        }

        // 2. Create Application
        const appId = crypto.randomUUID();
        await pool.query(`
            INSERT INTO public.loan_applications (
                id, user_id, loan_type, requested_amount, business_name, 
                business_age_months, monthly_revenue, industry, status, founder_cibil_score
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
            appId, userId, 'working_capital', 5000000, 'Seed Test Biz',
            36, 1000000, 'Technology', 'draft', 780
        ]);

        console.log(`Created App: ${appId}`);

        // 3. Insert Financial Data
        await pool.query(`
            INSERT INTO public.financial_data (
                application_id, average_monthly_revenue, average_balance, 
                total_revenue_last_6m, inflow_outflow_ratio, 
                revenue_consistency_score, cash_flow_volatility_score, 
                avg_transaction_count
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            appId, 1000000, 500000, 6000000, 1.2, 85, 20, 150
        ]);

        console.log('Inserted Financial Data');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seed();
