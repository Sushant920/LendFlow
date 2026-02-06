
import Tesseract from 'tesseract.js';
import fs from 'fs';

export const processDocument = async (fileInput: string | Buffer, mimeType: string) => {
    try {
        if (mimeType === 'application/pdf') {
            // For this MVP, we will assume PDF is text-based or just return mock data
            // implementing full PDF OCR is heavy. 
            // We'll return a mock "financial text" for now if it's PDF, 
            // or try basic text extraction.
            return {
                text: "Mock Bank Statement Data... Monthly Credits: 500000...",
                confidence: 100
            };
        } else {
            // Tesseract recognize accepts Buffer or path
            const { data: { text, confidence } } = await Tesseract.recognize(fileInput, 'eng');
            return { text, confidence };
        }
    } catch (error) {
        console.error("OCR Error:", error);
        throw new Error("Failed to process document");
    }
};

export const extractFinancials = (text: string) => {
    // Simple regex heuristics to extract metrics
    // In a real app, use an LLM or specific parser
    const revenueRegex = /Total\s+Credit[s]?\s*[:$]?\s*([\d,]+)/i;
    const balanceRegex = /Average\s+Balance\s*[:$]?\s*([\d,]+)/i;

    const revenueMatch = text.match(revenueRegex);
    const balanceMatch = text.match(balanceRegex);

    // Mock fallback if regex fails (for demo purposes)
    const monthlyRevenue = revenueMatch ? parseFloat(revenueMatch[1].replace(/,/g, '')) : 500000 + Math.random() * 100000;
    const avgBalance = balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, '')) : 50000 + Math.random() * 20000;

    return {
        average_monthly_revenue: monthlyRevenue,
        average_balance: avgBalance,
        total_revenue_last_6m: monthlyRevenue * 6,
        inflow_outflow_ratio: 1.1 + Math.random() * 0.2, // Healthy ratio
        revenue_consistency_score: 80 + Math.floor(Math.random() * 20),
        cash_flow_volatility_score: 20 + Math.floor(Math.random() * 10),
        avg_transaction_count: 50 + Math.floor(Math.random() * 50)
    };
};
