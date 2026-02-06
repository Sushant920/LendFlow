-- Create lenders table
CREATE TABLE public.lenders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    min_credit_score INTEGER DEFAULT 0,
    min_monthly_revenue DECIMAL(15, 2) DEFAULT 0,
    min_vintage_months INTEGER DEFAULT 0,
    min_loan_amount DECIMAL(15, 2) DEFAULT 0,
    max_loan_amount DECIMAL(15, 2) DEFAULT 0,
    interest_rate_min DECIMAL(5, 2),
    interest_rate_max DECIMAL(5, 2),
    active BOOLEAN DEFAULT true,
    tier TEXT CHECK (tier IN ('tier_1', 'tier_2', 'tier_3', 'fintech')),
    industries_served TEXT[], -- specific industries or empty for all
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create financial_data table (Extracted metrics from documents)
CREATE TABLE public.financial_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES public.loan_applications(id) ON DELETE CASCADE NOT NULL UNIQUE,
    average_monthly_revenue DECIMAL(15, 2),
    total_revenue_last_6m DECIMAL(15, 2),
    average_balance DECIMAL(15, 2),
    inflow_outflow_ratio DECIMAL(5, 2),
    revenue_consistency_score INTEGER CHECK (revenue_consistency_score BETWEEN 0 AND 100),
    cash_flow_volatility_score INTEGER CHECK (cash_flow_volatility_score BETWEEN 0 AND 100),
    avg_transaction_count INTEGER,
    recent_bounces INTEGER DEFAULT 0,
    extracted_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create eligibility_scores table
CREATE TABLE public.eligibility_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES public.loan_applications(id) ON DELETE CASCADE NOT NULL,
    overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
    breakdown JSONB, -- stores component scores like { "revenue": 25, "vintage": 15 ... }
    risk_flags TEXT[],
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create offers table
CREATE TABLE public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES public.loan_applications(id) ON DELETE CASCADE NOT NULL,
    lender_id UUID REFERENCES public.lenders(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL,
    tenure_months INTEGER NOT NULL,
    emi DECIMAL(15, 2),
    processing_fee DECIMAL(15, 2),
    approval_chance INTEGER CHECK (approval_chance BETWEEN 0 AND 100),
    status TEXT DEFAULT 'generated', -- generated, accepted, rejected
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create application_decisions table (Explainability)
CREATE TABLE public.application_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES public.loan_applications(id) ON DELETE CASCADE NOT NULL,
    lender_id UUID REFERENCES public.lenders(id) ON DELETE CASCADE NOT NULL,
    decision TEXT NOT NULL CHECK (decision IN ('approved', 'conditional', 'rejected')),
    primary_reason TEXT,
    detailed_feedback TEXT[],
    improvement_tips TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eligibility_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_decisions ENABLE ROW LEVEL SECURITY;

-- Policies for Lenders (Public read for now, admin write)
CREATE POLICY "Anyone can view active lenders" ON public.lenders
    FOR SELECT USING (active = true);

-- Policies for Financial Data
CREATE POLICY "Users can view their own financial data" ON public.financial_data
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.loan_applications WHERE id = application_id AND user_id = auth.uid())
    );

CREATE POLICY "Service role can manage financial data" ON public.financial_data
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Policies for Eligibility Scores
CREATE POLICY "Users can view their own scores" ON public.eligibility_scores
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.loan_applications WHERE id = application_id AND user_id = auth.uid())
    );
    
-- Policies for Offers
CREATE POLICY "Users can view their own offers" ON public.offers
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.loan_applications WHERE id = application_id AND user_id = auth.uid())
    );

-- Policies for Decisions
CREATE POLICY "Users can view their own decisions" ON public.application_decisions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.loan_applications WHERE id = application_id AND user_id = auth.uid())
    );

-- Insert Mock Lenders
INSERT INTO public.lenders (name, tier, min_credit_score, min_monthly_revenue, min_loan_amount, max_loan_amount, interest_rate_min, interest_rate_max, industries_served)
VALUES 
('HDFC Bank', 'tier_1', 75, 500000, 500000, 50000000, 9.5, 12.5, '{}'),
('Bajaj Finserv', 'tier_2', 65, 200000, 200000, 2500000, 11.0, 16.0, '{}'),
('LendingKart', 'fintech', 55, 50000, 50000, 1000000, 14.0, 24.0, '{}'),
('NeoGrowth', 'fintech', 50, 30000, 100000, 1500000, 15.0, 26.0, '{"Retail", "Restaurant"}');
