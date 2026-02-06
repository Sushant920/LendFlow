
interface FinancialData {
    monthly_revenue: number;
    revenue_consistency_score: number;
    cash_flow_volatility_score: number;
    inflow_outflow_ratio: number;
    business_vintage_months?: number; // Optional, defaults to 12 if missing
}

export const calculateEligibilityScore = (data: FinancialData) => {
    let score = 0;
    const breakdown: any = {};

    // 1. Revenue Strength (30%)
    // > 5L/month = full 30 points
    const revenuePoints = Math.min(30, (data.monthly_revenue / 500000) * 30);
    score += revenuePoints;
    breakdown.revenue = Math.round(revenuePoints);

    // 2. Revenue Consistency (20%)
    const consistencyPoints = (data.revenue_consistency_score / 100) * 20;
    score += consistencyPoints;
    breakdown.consistency = Math.round(consistencyPoints);

    // 3. Cash Flow Health (20%)
    // Lower volatility is better
    const healthPoints = Math.max(0, 20 - (data.cash_flow_volatility_score / 100 * 20));
    score += healthPoints;
    breakdown.health = Math.round(healthPoints);

    // 4. Inflow/Outflow Ratio (15%)
    // > 1.1 is good
    const ratioPoints = data.inflow_outflow_ratio >= 1.1 ? 15 : (data.inflow_outflow_ratio >= 1.0 ? 10 : 0);
    score += ratioPoints;
    breakdown.ratio = Math.round(ratioPoints);

    // 5. Vintage (15%) - Mock value if not present
    const vintage = data.business_vintage_months || 24;
    const vintagePoints = Math.min(15, (vintage / 24) * 15);
    score += vintagePoints;
    breakdown.vintage = Math.round(vintagePoints);

    return {
        overall_score: Math.round(score),
        breakdown,
        risk_flags: score < 50 ? ['Low Revenue', 'High Volatility'] : []
    };
};
