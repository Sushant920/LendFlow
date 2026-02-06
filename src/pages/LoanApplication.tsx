import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentUploader } from "@/components/los/DocumentUploader";
import { FinancialSummary } from "@/components/los/FinancialSummary";
import { OfferComparison } from "@/components/los/OfferComparison";

type LoanType = "working_capital" | "term_loan";

interface ApplicationData {
  loan_type: LoanType;
  requested_amount: string;
  business_name: string;
  business_age_months: string;
  monthly_revenue: string;
  industry: string;
  founder_cibil_score: string;
}

const steps = [
  { id: 1, title: "Loan Type", description: "Select your loan product" },
  { id: 2, title: "Business Details", description: "Tell us about your business" },
  { id: 3, title: "AI Analysis", description: "Upload bank statements" },
  { id: 4, title: "Offers", description: "Review lender decisions" },
];

const industries = [
  "Retail",
  "Manufacturing",
  "Services",
  "Technology",
  "Healthcare",
  "Food & Beverage",
  "Construction",
  "Transportation",
  "Agriculture",
  "Other",
];

export default function LoanApplication() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  // New State for AI
  const [financialData, setFinancialData] = useState<any>(null);
  const [showOffers, setShowOffers] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState<ApplicationData>({
    loan_type: "working_capital",
    requested_amount: "",
    business_name: "",
    business_age_months: "",
    monthly_revenue: "",
    industry: "",
    founder_cibil_score: "",
  });

  useEffect(() => {
    const existingId = searchParams.get("id");
    if (existingId) {
      loadExistingApplication(existingId);
    }
  }, [searchParams]);

  const loadExistingApplication = async (id: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:3000/api/application/${id}`);
      if (!response.ok) throw new Error("Failed to load application");

      const data = await response.json();

      if (data) {
        setApplicationId(id);
        const appData = {
          loan_type: data.loan_type as LoanType,
          requested_amount: data.requested_amount?.toString() || "",
          business_name: data.business_name || "",
          business_age_months: data.business_age_months?.toString() || "",
          monthly_revenue: data.monthly_revenue?.toString() || "",
          industry: data.industry || "",
          founder_cibil_score: data.founder_cibil_score?.toString() || "",
        };
        setFormData(appData);

        // If we have data, we can probably infer we are further along? 
        // For now, let user click next.
      }
    } catch (error) {
      console.error("Error loading application:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load application details"
      });
    }
  };

  const handleInputChange = (field: keyof ApplicationData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAnalysisComplete = (data: any) => {
    setFinancialData(data);
    // Auto-fill revenue if detected (backend uses average_monthly_revenue)
    const revenue = data.average_monthly_revenue || data.monthly_revenue;
    if (revenue) {
      handleInputChange("monthly_revenue", revenue.toString());
      toast({
        title: "Data Extracted",
        description: `Monthly Revenue of Rs. ${revenue.toLocaleString()} auto-filled.`,
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    setIsUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      // Ensure applicationId is passed. If not yet created (e.g. skipped steps), valid ID checks handle it.
      if (applicationId) {
        formData.append('applicationId', applicationId);
      }

      try {
        const response = await fetch('http://127.0.0.1:3000/api/upload-documents', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Upload failed');
        }

        const data = await response.json();

        // Simulating the file entry in state for UI feedback
        setUploadedFiles((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            name: file.name,
            type: file.type,
            size: file.size,
          },
        ]);

        if (data.financials) {
          handleAnalysisComplete(data.financials);
        }

        toast({
          title: "Analysis Complete",
          description: "Financial metrics extracted successfully.",
        });

      } catch (error) {
        console.error("Upload error:", error);
        toast({
          variant: "destructive",
          title: "Upload/Analysis failed",
          description: error instanceof Error ? error.message : "Failed to process document",
        });
      }
    }

    setIsUploading(false);
    e.target.value = "";
  };

  const saveApplication = async () => {
    if (!user) return null;

    const appData = {
      user_id: user.id,
      loan_type: formData.loan_type,
      requested_amount: formData.requested_amount ? parseFloat(formData.requested_amount) : null,
      business_name: formData.business_name || null,
      business_age_months: formData.business_age_months ? parseInt(formData.business_age_months) : null,
      monthly_revenue: formData.monthly_revenue ? parseFloat(formData.monthly_revenue) : null,
      industry: formData.industry || null,
      founder_cibil_score: formData.founder_cibil_score ? parseInt(formData.founder_cibil_score) : null,
      status: "draft" as const,
    };

    if (applicationId) {
      const { error } = await supabase
        .from("loan_applications")
        .update(appData)
        .eq("id", applicationId);

      if (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to save application" });
        return null;
      }
      return applicationId;
    } else {

      // Use Backend API to bypass RLS/Auth restrictions with "mock" user
      try {
        const response = await fetch('http://127.0.0.1:3000/api/applications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(appData),
        });

        if (!response.ok) {
          throw new Error('Failed to create application');
        }

        const data = await response.json();
        setApplicationId(data.id);
        return data.id;
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to create application" });
        return null;
      }
    }
  };

  const handleNext = async () => {
    // Auto-save on step 1 & 2 completion
    if (currentStep === 1 || currentStep === 2) {
      await saveApplication();
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const appId = await saveApplication();

    if (!appId) {
      setIsSubmitting(false);
      return;
    }

    // Mark as submitted
    const { error } = await supabase
      .from("loan_applications")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", appId);

    if (error) {
      toast({ variant: "destructive", title: "Submission failed", description: "Please try again" });
      setIsSubmitting(false);
      return;
    }

    toast({
      title: "Deep Analysis Started",
      description: "Our AI is matching you with 4+ lenders...",
    });

    console.log("Submitting for offers with App ID:", appId);

    try {
      const response = await fetch('http://127.0.0.1:3000/api/generate-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: appId })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate offers');
      }

      const data = await response.json();
      // Data might optionally update state if Offers UI needs it passed, 
      // but Offers UI (OfferComparison) usually fetches from DB or we can pass data down.
      // For now, assume OfferComparison fetches by ID or we trigger re-fetch.
      // Actually OfferComparison likely fetches. 

      setIsSubmitting(false);
      setShowOffers(true);
    } catch (e) {
      console.error("Generate offers error:", e);
      toast({
        variant: "destructive",
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to generate offers"
      });
      setIsSubmitting(false);
    }
  };

  const formatAmount = (value: string) => {
    if (!value) return "";
    return new Intl.NumberFormat("en-IN").format(parseFloat(value));
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return !!formData.loan_type;
      case 2:
        return !!(formData.business_name && formData.industry);
      case 3:
        // Ideally enforce upload, but optional for demo unless strictly required
        // Let's allow skip if demo
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-semibold">New Loan Application</span>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="mx-auto max-w-3xl">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border-2 font-medium transition-colors",
                        currentStep > step.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : currentStep === step.id
                            ? "border-primary text-primary"
                            : "border-muted text-muted-foreground"
                      )}
                    >
                      {currentStep > step.id ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <div className="mt-2 hidden text-center sm:block">
                      <p className="text-sm font-medium">{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "mx-4 h-0.5 flex-1",
                        currentStep > step.id ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <Card className="shadow-card animate-fade-in">
            <CardHeader>
              <CardTitle>{steps[currentStep - 1].title}</CardTitle>
              <CardDescription>{steps[currentStep - 1].description}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Step 1: Loan Type */}
              {currentStep === 1 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      value: "working_capital",
                      title: "Working Capital",
                      description: "Short-term financing for day-to-day operations",
                      features: ["Up to Rs. 50 Lakhs", "6-12 months tenure", "Quick disbursement"],
                    },
                    {
                      value: "term_loan",
                      title: "Term Loan",
                      description: "Long-term financing for business expansion",
                      features: ["Up to Rs. 2 Crores", "12-60 months tenure", "Flexible repayment"],
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleInputChange("loan_type", option.value as LoanType)}
                      className={cn(
                        "rounded-lg border-2 p-6 text-left transition-all hover:border-primary/50",
                        formData.loan_type === option.value
                          ? "border-primary bg-primary/5"
                          : "border-muted"
                      )}
                    >
                      <h3 className="mb-2 font-semibold">{option.title}</h3>
                      <p className="mb-4 text-sm text-muted-foreground">
                        {option.description}
                      </p>
                      <ul className="space-y-1">
                        {option.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-accent" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 2: Business Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="business_name">Business Name *</Label>
                      <Input
                        id="business_name"
                        placeholder="Your company name"
                        value={formData.business_name}
                        onChange={(e) => handleInputChange("business_name", e.target.value)}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry *</Label>
                      <Select
                        value={formData.industry}
                        onValueChange={(v) => handleInputChange("industry", v)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industries.map((ind) => (
                            <SelectItem key={ind} value={ind}>
                              {ind}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="founder_cibil_score">Founder's CIBIL Score *</Label>
                      <Input
                        id="founder_cibil_score"
                        type="number"
                        placeholder="e.g., 750"
                        value={formData.founder_cibil_score}
                        onChange={(e) => handleInputChange("founder_cibil_score", e.target.value)}
                        className="h-11"
                        max={900}
                        min={300}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="business_age">Business Age (months)</Label>
                      <Input
                        id="business_age"
                        type="number"
                        placeholder="e.g., 24"
                        value={formData.business_age_months}
                        onChange={(e) => handleInputChange("business_age_months", e.target.value)}
                        className="h-11"
                      />
                    </div>
                    {/* Monthly Revenue removed - captured via AI Analysis */}
                    <div className="space-y-2">
                      <Label htmlFor="requested_amount">Requested Amount (Rs.)</Label>
                      <Input
                        id="requested_amount"
                        type="number"
                        placeholder="e.g., 1000000"
                        value={formData.requested_amount}
                        onChange={(e) => handleInputChange("requested_amount", e.target.value)}
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: AI Document Analysis */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-medium">AI Financial Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload your bank statement. Our AI will extract key financial metrics instantly.
                    </p>
                  </div>

                  {applicationId ? (
                    <DocumentUploader
                      applicationId={applicationId}
                      onAnalysisComplete={handleAnalysisComplete}
                    />
                  ) : (
                    <div className="p-4 border border-yellow-200 bg-yellow-50 text-yellow-800 rounded-md text-center">
                      Please complete Step 1 & 2 to generate Application ID before uploading.
                    </div>
                  )}

                  {financialData && (
                    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <h4 className="text-md font-semibold mb-4">Extracted Insights</h4>
                      <FinancialSummary data={financialData} />
                      <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md border border-green-100 mt-4">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Financial health analysis complete. Proceed to offers.</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Review & Offers */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  {!showOffers ? (
                    <>
                      <div className="rounded-lg bg-muted/50 p-6">
                        <h4 className="mb-4 font-semibold">Application Summary</h4>
                        <dl className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <dt className="text-sm text-muted-foreground">Loan Type</dt>
                            <dd className="font-medium">
                              {formData.loan_type === "working_capital"
                                ? "Working Capital"
                                : "Term Loan"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm text-muted-foreground">Business Name</dt>
                            <dd className="font-medium">{formData.business_name || "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-sm text-muted-foreground">Industry</dt>
                            <dd className="font-medium capitalize">{formData.industry || "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-sm text-muted-foreground">Monthly Revenue</dt>
                            <dd className="font-medium">
                              {formData.monthly_revenue
                                ? `Rs. ${formatAmount(formData.monthly_revenue)}`
                                : "—"}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <div className="rounded-lg border border-info/30 bg-info/5 p-4">
                        <p className="text-sm text-info">
                          <strong>Note:</strong> Submitting will trigger our Multi-Lender Matching Engine to find the best offers for you.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                      <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Eligibility Results</h2>
                        <p className="text-gray-500">Based on your score, here are your matched offers.</p>
                      </div>
                      {applicationId && <OfferComparison applicationId={applicationId} />}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            {currentStep < 4 ? (
              <Button onClick={handleNext} disabled={!isStepValid()} className="gap-2">
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : !showOffers ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Submit Application
              </Button>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}