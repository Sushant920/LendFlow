
import { createClient } from '@supabase/supabase-js';

import { supabase } from '../db.js';

interface Lender {
    id: string;
    name: string;
    min_credit_score: number;
    min_monthly_revenue: number;
    interest_rate_min: number;
    interest_rate_max: number;
    max_loan_amount: number;
}

export const matchLenders = async (score: number, monthlyRevenue: number, applicationId: string) => {
    // Fetch active lenders
    const { data: lenders, error } = await supabase
        .from('lenders')
        .select('*')
        .eq('active', true);

    if (error || !lenders) {
        console.error('Error fetching lenders:', error);
        return { offers: [], decisions: [] };
    }

    const eligibleLenders = lenders.filter((lender: Lender) => {
        return score >= lender.min_credit_score && monthlyRevenue >= lender.min_monthly_revenue;
    });

    const decisions = lenders.map((lender: Lender) => {
        const isEligible = eligibleLenders.find(l => l.id === lender.id);
        return {
            lender_id: lender.id,
            lender_name: lender.name,
            application_id: applicationId,
            decision: isEligible ? 'approved' : 'rejected',
            primary_reason: isEligible
                ? 'Meets all criteria'
                : (score < lender.min_credit_score ? 'Credit score too low' : 'Monthly revenue too low'),
            improvement_tips: isEligible ? [] : ['Increase revenue', 'Improve consistency']
        };
    });

    // Generate Offers for eligible
    const offers = eligibleLenders.map((lender: Lender) => ({
        lender_id: lender.id,
        lender_name: lender.name,
        application_id: applicationId,
        amount: Math.min(lender.max_loan_amount, monthlyRevenue * 3), // 3x revenue cap
        interest_rate: lender.interest_rate_min + Math.random() * (lender.interest_rate_max - lender.interest_rate_min),
        tenure_months: 12,
        emi: 0, // Calculate later
        approval_chance: Math.min(99, score + 10),
        status: 'generated',
        processing_fee: 0
    }));

    return { offers, decisions };
};
