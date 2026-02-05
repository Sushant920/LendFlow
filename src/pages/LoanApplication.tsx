 import { useState, useEffect } from "react";
 import { useNavigate, useSearchParams } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/hooks/useAuth";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
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
   FileUp,
   Loader2,
   Upload,
   X,
 } from "lucide-react";
 import { cn } from "@/lib/utils";
 
 type LoanType = "working_capital" | "term_loan";
 
 interface ApplicationData {
   loan_type: LoanType;
   requested_amount: string;
   business_name: string;
   business_age_months: string;
   monthly_revenue: string;
   industry: string;
 }
 
 interface UploadedFile {
   id: string;
   name: string;
   type: string;
   size: number;
 }
 
 const steps = [
   { id: 1, title: "Loan Type", description: "Select your loan product" },
   { id: 2, title: "Business Details", description: "Tell us about your business" },
   { id: 3, title: "Documents", description: "Upload required documents" },
   { id: 4, title: "Review", description: "Review and submit" },
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
   const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
   const [isUploading, setIsUploading] = useState(false);
   
   const [formData, setFormData] = useState<ApplicationData>({
     loan_type: "working_capital",
     requested_amount: "",
     business_name: "",
     business_age_months: "",
     monthly_revenue: "",
     industry: "",
   });
 
   useEffect(() => {
     const existingId = searchParams.get("id");
     if (existingId) {
       loadExistingApplication(existingId);
     }
   }, [searchParams]);
 
   const loadExistingApplication = async (id: string) => {
     const { data, error } = await supabase
       .from("loan_applications")
       .select("*")
       .eq("id", id)
       .single();
 
     if (data && !error) {
       setApplicationId(id);
       setFormData({
         loan_type: data.loan_type as LoanType,
         requested_amount: data.requested_amount?.toString() || "",
         business_name: data.business_name || "",
         business_age_months: data.business_age_months?.toString() || "",
         monthly_revenue: data.monthly_revenue?.toString() || "",
         industry: data.industry || "",
       });
     }
   };
 
   const handleInputChange = (field: keyof ApplicationData, value: string) => {
     setFormData((prev) => ({ ...prev, [field]: value }));
   };
 
   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const files = e.target.files;
     if (!files || !user) return;
 
     setIsUploading(true);
 
     for (const file of Array.from(files)) {
       const fileId = crypto.randomUUID();
       const filePath = `${user.id}/${fileId}-${file.name}`;
 
       const { error } = await supabase.storage
         .from("documents")
         .upload(filePath, file);
 
       if (!error) {
         setUploadedFiles((prev) => [
           ...prev,
           {
             id: fileId,
             name: file.name,
             type: file.type,
             size: file.size,
           },
         ]);
       } else {
         toast({
           variant: "destructive",
           title: "Upload failed",
           description: `Failed to upload ${file.name}`,
         });
       }
     }
 
     setIsUploading(false);
     e.target.value = "";
   };
 
   const removeFile = (id: string) => {
     setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
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
       status: "draft" as const,
     };
 
     if (applicationId) {
       const { error } = await supabase
         .from("loan_applications")
         .update(appData)
         .eq("id", applicationId);
       
       if (error) {
         toast({
           variant: "destructive",
           title: "Error",
           description: "Failed to save application",
         });
         return null;
       }
       return applicationId;
     } else {
       const { data, error } = await supabase
         .from("loan_applications")
         .insert(appData)
         .select("id")
         .single();
 
       if (error || !data) {
         toast({
           variant: "destructive",
           title: "Error",
           description: "Failed to create application",
         });
         return null;
       }
 
       setApplicationId(data.id);
       return data.id;
     }
   };
 
   const handleNext = async () => {
     if (currentStep === 1) {
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
 
     // Save documents
     for (const file of uploadedFiles) {
       await supabase.from("application_documents").insert({
         application_id: appId,
         document_type: file.type.includes("pdf") ? "bank_statement" : "gst_return",
         file_name: file.name,
         file_path: `${user?.id}/${file.id}-${file.name}`,
         file_size: file.size,
       });
     }
 
     // Update status to submitted and simulate scoring
     const riskScore = Math.floor(Math.random() * 60) + 40; // 40-100
     const eligibleMin = parseFloat(formData.monthly_revenue) * 2;
     const eligibleMax = parseFloat(formData.monthly_revenue) * 6;
     
     const { error } = await supabase
       .from("loan_applications")
       .update({
         status: "submitted",
         submitted_at: new Date().toISOString(),
         risk_score: riskScore,
         eligible_amount_min: eligibleMin || 100000,
         eligible_amount_max: eligibleMax || 500000,
         interest_rate_min: riskScore >= 70 ? 12 : riskScore >= 50 ? 16 : 20,
         interest_rate_max: riskScore >= 70 ? 15 : riskScore >= 50 ? 20 : 24,
         suggested_tenure_months: formData.loan_type === "working_capital" ? 12 : 36,
         decision_reasons: JSON.stringify([
           "Business revenue analysis completed",
           "Industry risk assessment performed",
           "Document verification in progress",
         ]),
         improvement_tips: JSON.stringify([
           "Maintain consistent monthly revenue",
           "Keep GST filings up to date",
           "Improve bank statement consistency",
         ]),
       })
       .eq("id", appId);
 
     if (error) {
       toast({
         variant: "destructive",
         title: "Submission failed",
         description: "Please try again",
       });
       setIsSubmitting(false);
       return;
     }
 
     toast({
       title: "Application submitted!",
       description: "We'll review your application and get back to you soon.",
     });
 
     navigate(`/applications/${appId}`);
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
         return !!(formData.business_name && formData.monthly_revenue && formData.industry);
       case 3:
         return true; // Documents optional for MVP
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
                       features: ["Up to ₹50 Lakhs", "6-12 months tenure", "Quick disbursement"],
                     },
                     {
                       value: "term_loan",
                       title: "Term Loan",
                       description: "Long-term financing for business expansion",
                       features: ["Up to ₹2 Crores", "12-60 months tenure", "Flexible repayment"],
                     },
                   ].map((option) => (
                     <button
                       key={option.value}
                       type="button"
                       onClick={() => handleInputChange("loan_type", option.value)}
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
                             <SelectItem key={ind} value={ind.toLowerCase()}>
                               {ind}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
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
                     <div className="space-y-2">
                       <Label htmlFor="monthly_revenue">Monthly Revenue (₹) *</Label>
                       <Input
                         id="monthly_revenue"
                         type="number"
                         placeholder="e.g., 500000"
                         value={formData.monthly_revenue}
                         onChange={(e) => handleInputChange("monthly_revenue", e.target.value)}
                         className="h-11"
                       />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="requested_amount">Requested Amount (₹)</Label>
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
 
               {/* Step 3: Documents */}
               {currentStep === 3 && (
                 <div className="space-y-6">
                   <div className="rounded-lg border-2 border-dashed p-8 text-center">
                     <input
                       type="file"
                       id="file-upload"
                       multiple
                       accept=".pdf,.jpg,.jpeg,.png"
                       onChange={handleFileUpload}
                       className="hidden"
                     />
                     <label
                       htmlFor="file-upload"
                       className="cursor-pointer"
                     >
                       <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                         {isUploading ? (
                           <Loader2 className="h-6 w-6 animate-spin text-primary" />
                         ) : (
                           <Upload className="h-6 w-6 text-primary" />
                         )}
                       </div>
                       <p className="mb-2 font-medium">
                         {isUploading ? "Uploading..." : "Click to upload documents"}
                       </p>
                       <p className="text-sm text-muted-foreground">
                         Bank statements, GST returns (PDF, JPG, PNG up to 10MB)
                       </p>
                     </label>
                   </div>
 
                   {uploadedFiles.length > 0 && (
                     <div className="space-y-2">
                       <p className="text-sm font-medium">Uploaded documents</p>
                       {uploadedFiles.map((file) => (
                         <div
                           key={file.id}
                           className="flex items-center justify-between rounded-lg border p-3"
                         >
                           <div className="flex items-center gap-3">
                             <FileUp className="h-5 w-5 text-muted-foreground" />
                             <div>
                               <p className="text-sm font-medium">{file.name}</p>
                               <p className="text-xs text-muted-foreground">
                                 {(file.size / 1024 / 1024).toFixed(2)} MB
                               </p>
                             </div>
                           </div>
                           <Button
                             variant="ghost"
                             size="icon"
                             onClick={() => removeFile(file.id)}
                           >
                             <X className="h-4 w-4" />
                           </Button>
                         </div>
                       ))}
                     </div>
                   )}
 
                   <p className="text-sm text-muted-foreground">
                     Documents are optional for this demo. In production, AI-powered document analysis
                     would verify and extract data from your uploads.
                   </p>
                 </div>
               )}
 
               {/* Step 4: Review */}
               {currentStep === 4 && (
                 <div className="space-y-6">
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
                         <dt className="text-sm text-muted-foreground">Business Age</dt>
                         <dd className="font-medium">
                           {formData.business_age_months
                             ? `${formData.business_age_months} months`
                             : "—"}
                         </dd>
                       </div>
                       <div>
                         <dt className="text-sm text-muted-foreground">Monthly Revenue</dt>
                         <dd className="font-medium">
                           {formData.monthly_revenue
                             ? `₹${formatAmount(formData.monthly_revenue)}`
                             : "—"}
                         </dd>
                       </div>
                       <div>
                         <dt className="text-sm text-muted-foreground">Requested Amount</dt>
                         <dd className="font-medium">
                           {formData.requested_amount
                             ? `₹${formatAmount(formData.requested_amount)}`
                             : "—"}
                         </dd>
                       </div>
                       <div className="sm:col-span-2">
                         <dt className="text-sm text-muted-foreground">Documents</dt>
                         <dd className="font-medium">
                           {uploadedFiles.length > 0
                             ? `${uploadedFiles.length} file(s) uploaded`
                             : "No documents uploaded"}
                         </dd>
                       </div>
                     </dl>
                   </div>
 
                   <div className="rounded-lg border border-info/30 bg-info/5 p-4">
                     <p className="text-sm text-info">
                       <strong>Note:</strong> By submitting this application, you consent to our
                       eligibility assessment using the information provided. Results will be
                       displayed immediately after submission.
                     </p>
                   </div>
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
             ) : (
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
             )}
           </div>
         </div>
       </div>
     </div>
   );
 }