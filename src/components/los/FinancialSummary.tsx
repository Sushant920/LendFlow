
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DollarSign, Activity, TrendingUp } from 'lucide-react';

interface FinancialSummaryProps {
    data: any;
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({ data }) => {
    if (!data) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Monthly Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">Rs. {data.average_monthly_revenue?.toLocaleString() || data.monthly_revenue?.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                        Consistency Score: {data.revenue_consistency_score}/100
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.avg_transaction_count} Txns/mo</div>
                    <p className="text-xs text-muted-foreground">
                        Avg Balance: Rs. {data.average_balance?.toLocaleString()}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cash Flow Health</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.cash_flow_volatility_score}/100</div>
                    <p className="text-xs text-muted-foreground">
                        Inflow/Outflow: {data.inflow_outflow_ratio?.toFixed(2)}x
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};
