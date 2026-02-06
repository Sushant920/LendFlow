
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';


import { useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface OfferComparisonProps {
    applicationId: string;
}

export const OfferComparison: React.FC<OfferComparisonProps> = ({ applicationId }) => {
    const [offers, setOffers] = useState<any[]>([]);
    const [decisions, setDecisions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [selectedLender, setSelectedLender] = useState("");

    const navigate = useNavigate();

    const fetchOffers = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://127.0.0.1:3000/api/generate-offers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId })
            });
            const data = await response.json();
            setOffers(data.offers || []);
            setDecisions(data.decisions || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOffers();
    }, [applicationId]);

    const handleApply = async (lenderName: string, lenderId: string) => {
        try {
            await fetch('http://127.0.0.1:3000/api/apply-offer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId, lenderId })
            });

            // Update local state to reflect change immediately
            setOffers(prevOffers => prevOffers.map(offer =>
                offer.lender_id === lenderId
                    ? { ...offer, status: 'accepted' }
                    : offer
            ));
        } catch (e) {
            console.error(e);
        }
        setSelectedLender(lenderName);
        setIsConfirmationOpen(true);
    };

    /* Sort offers by Approval Chance */
    const sortedOffers = Array.isArray(offers)
        ? [...offers]
            .filter(o => o && typeof o === 'object') // Filter out nulls
            .sort((a, b) => (Number(b.approval_chance) || 0) - (Number(a.approval_chance) || 0))
        : [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center gap-4 flex-wrap">
                <h2 className="text-xl font-bold">Lender Offers</h2>
                <div className="flex gap-2">
                    <Button onClick={() => navigate('/dashboard')} variant="secondary" size="sm">
                        Go to Dashboard
                    </Button>
                    <Button onClick={fetchOffers} variant="outline" size="sm">Refresh Offers</Button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10">Generatng offers from 4+ lenders...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Render Offers */}
                    {sortedOffers.map((offer: any) => (
                        <Card key={offer.lender_id} className="border-green-200 bg-green-50 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-bl-lg">
                                {offer.approval_chance}% Chance
                            </div>
                            <CardHeader>
                                <CardTitle>
                                    {offer.lender_name || "Lender Offer"}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="text-3xl font-bold text-green-700">Rs. {Number(offer.amount).toLocaleString()}</div>
                                <div className="text-sm text-gray-600">
                                    Interest: <span className="font-semibold">{Number(offer.interest_rate).toFixed(2)}%</span>
                                </div>
                                <div className="text-sm text-gray-600">
                                    Tenure: {offer.tenure_months} Months
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className={`w-full ${offer.status === 'accepted'
                                        ? "bg-gray-400 cursor-not-allowed hover:bg-gray-400"
                                        : "bg-green-600 hover:bg-green-700"
                                        }`}
                                    disabled={offer.status === 'accepted'}
                                    onClick={() => handleApply(offer.lender_name || "Lender", offer.lender_id)}
                                >
                                    {offer.status === 'accepted' ? "Applied" : "Apply Now"}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}

                    {/* Render Rejections */}
                    {Array.isArray(decisions) && decisions.filter((d: any) => d.decision === 'rejected').map((decision: any) => (
                        <Card key={decision.lender_id} className="opacity-75 border-red-100 bg-gray-50">
                            <CardHeader>
                                <CardTitle className="text-gray-500 flex items-center gap-2">
                                    <X className="h-4 w-4 text-red-500" />
                                    Lender Declined
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-red-600 font-medium">{decision.primary_reason}</p>
                                <div className="mt-2 text-xs text-gray-500">
                                    <p className="font-semibold mb-1">To improve:</p>
                                    <ul className="list-disc pl-4">
                                        {decision.improvement_tips?.map((tip: string, i: number) => (
                                            <li key={i}>{tip}</li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isConfirmationOpen} onOpenChange={setIsConfirmationOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Application Forwarded</DialogTitle>
                        <DialogDescription>
                            Your application has been successfully forwarded to <span className="font-semibold text-foreground">{selectedLender}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 text-sm text-muted-foreground">
                        Please allow <strong>24-48 hours</strong> for the lender to review your application and revert with a final decision. You can track the status of your application on your dashboard.
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsConfirmationOpen(false)}>Close</Button>
                        <Button onClick={() => navigate('/dashboard')} variant="default">View Dashboard</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
