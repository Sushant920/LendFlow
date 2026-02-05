 import { useEffect, useState } from "react";
 import { useParams, useNavigate } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/hooks/useAuth";
 import { DashboardLayout } from "@/components/layout/DashboardLayout";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { StatusBadge } from "@/components/StatusBadge";
 import { RiskScoreGauge } from "@/components/RiskScoreGauge";
 import {
   ArrowLeft,
   Building,
   Calendar,
   CheckCircle2,
   Clock,
   FileText,
   IndianRupee,
   Lightbulb,
   TrendingUp,
   AlertTriangle,
 } from "lucide-react";
 import { format } from "date-fns";
 
 interface Application {
   id: string;
   loan_type: "working_capital" | "term_loan";
   status: "draft" | "submitted" | "under_review" | "approved" | "rejected" | "requires_info";
   requested_amount: number | null;
   business_name: string | null;
   business_age_months: number | null;
   monthly_revenue: number | null;
   industry: string | null;
   risk_score: number | null;
   eligible_amount_min: number | null;
   eligible_amount_max: number | null;
   interest_rate_min: number | null;
   interest_rate_max: number | null;
   suggested_tenure_months: number | null;
   decision_reasons: string | null;
   improvement_tips: string | null;
   submitted_at: string | null;
   created_at: string;
 }
 
 export default function ApplicationDetails() {
   const { id } = useParams<{ id: string }>();
   const { user, role } = useAuth();
   const navigate = useNavigate();
   const [application, setApplication] = useState<Application | null>(null);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     if (id) {
       fetchApplication();
     }
   }, [id]);
 
   const fetchApplication = async () => {
     const { data, error } = await supabase
       .from("loan_applications")
       .select("*")
       .eq("id", id)
       .single();
 
     if (!error && data) {
       setApplication(data as Application);
     }
     setLoading(false);
   };
 
   const formatAmount = (amount: number | null) => {
     if (!amount) return "—";
     return new Intl.NumberFormat("en-IN", {
       style: "currency",
       currency: "INR",
       maximumFractionDigits: 0,
     }).format(amount);
   };
 
   const formatLoanType = (type: string) => {
     return type === "working_capital" ? "Working Capital" : "Term Loan";
   };
 
   const parseJsonArray = (json: string | null): string[] => {
     if (!json) return [];
     try {
       return JSON.parse(json);
     } catch {
       return [];
     }
   };
 
   if (loading) {
     return (
       <DashboardLayout>
         <div className="flex items-center justify-center py-12">
           <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
         </div>
       </DashboardLayout>
     );
   }
 
   if (!application) {
     return (
       <DashboardLayout>
         <div className="text-center py-12">
           <h2 className="text-xl font-semibold mb-2">Application not found</h2>
           <Button onClick={() => navigate(-1)}>Go back</Button>
         </div>
       </DashboardLayout>
     );
   }
 
   const reasons = parseJsonArray(application.decision_reasons);
   const tips = parseJsonArray(application.improvement_tips);
 
   return (
     <DashboardLayout>
       <div className="space-y-6">
         {/* Header */}
         <div className="flex items-center gap-4">
           <Button
             variant="ghost"
             size="icon"
             onClick={() => navigate(role === "admin" ? "/admin/applications" : "/dashboard")}
           >
             <ArrowLeft className="h-5 w-5" />
           </Button>
           <div className="flex-1">
             <div className="flex items-center gap-3">
               <h1 className="text-2xl font-bold">
                 {formatLoanType(application.loan_type)} Application
               </h1>
               <StatusBadge status={application.status} />
             </div>
             <p className="text-muted-foreground">
               {application.business_name || "Unnamed business"} •{" "}
               {format(new Date(application.created_at), "MMM d, yyyy")}
             </p>
           </div>
         </div>
 
         <div className="grid gap-6 lg:grid-cols-3">
           {/* Main Content */}
           <div className="space-y-6 lg:col-span-2">
             {/* Risk Score Card */}
             {application.risk_score !== null && (
               <Card className="shadow-card overflow-hidden">
                 <div
                   className={`p-6 ${
                     application.risk_score >= 70
                       ? "bg-success/10"
                       : application.risk_score >= 40
                       ? "bg-warning/10"
                       : "bg-destructive/10"
                   }`}
                 >
                   <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                     <RiskScoreGauge score={application.risk_score} size="lg" />
                     <div className="flex-1 text-center sm:text-left">
                       <h3 className="mb-2 text-xl font-semibold">Eligibility Assessment</h3>
                       <p className="mb-4 text-muted-foreground">
                         {application.risk_score >= 70
                           ? "Congratulations! Your application shows strong eligibility indicators."
                           : application.risk_score >= 40
                           ? "Your application is being reviewed. Some factors may require attention."
                           : "We need additional information to process your application."}
                       </p>
 
                       {application.eligible_amount_min && application.eligible_amount_max && (
                         <div className="grid gap-4 sm:grid-cols-3">
                           <div>
                             <p className="text-sm text-muted-foreground">Eligible Amount</p>
                             <p className="font-semibold">
                               {formatAmount(application.eligible_amount_min)} -{" "}
                               {formatAmount(application.eligible_amount_max)}
                             </p>
                           </div>
                           <div>
                             <p className="text-sm text-muted-foreground">Interest Rate</p>
                             <p className="font-semibold">
                               {application.interest_rate_min}% - {application.interest_rate_max}%
                             </p>
                           </div>
                           <div>
                             <p className="text-sm text-muted-foreground">Suggested Tenure</p>
                             <p className="font-semibold">
                               {application.suggested_tenure_months} months
                             </p>
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
               </Card>
             )}
 
             {/* Decision Reasons */}
             {reasons.length > 0 && (
               <Card className="shadow-card">
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <CheckCircle2 className="h-5 w-5 text-primary" />
                     Decision Factors
                   </CardTitle>
                   <CardDescription>
                     Key factors that influenced the eligibility assessment
                   </CardDescription>
                 </CardHeader>
                 <CardContent>
                   <ul className="space-y-3">
                     {reasons.map((reason, index) => (
                       <li key={index} className="flex items-start gap-3">
                         <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                         <span>{reason}</span>
                       </li>
                     ))}
                   </ul>
                 </CardContent>
               </Card>
             )}
 
             {/* Improvement Tips */}
             {tips.length > 0 && (
               <Card className="shadow-card border-warning/30">
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <Lightbulb className="h-5 w-5 text-warning" />
                     Tips to Improve Eligibility
                   </CardTitle>
                   <CardDescription>
                     Recommendations to strengthen future applications
                   </CardDescription>
                 </CardHeader>
                 <CardContent>
                   <ul className="space-y-3">
                     {tips.map((tip, index) => (
                       <li key={index} className="flex items-start gap-3">
                         <TrendingUp className="mt-0.5 h-4 w-4 text-warning" />
                         <span>{tip}</span>
                       </li>
                     ))}
                   </ul>
                 </CardContent>
               </Card>
             )}
           </div>
 
           {/* Sidebar */}
           <div className="space-y-6">
             {/* Business Details */}
             <Card className="shadow-card">
               <CardHeader>
                 <CardTitle className="text-base">Business Details</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="flex items-center gap-3">
                   <div className="rounded-lg bg-muted p-2">
                     <Building className="h-4 w-4 text-muted-foreground" />
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Business Name</p>
                     <p className="font-medium">{application.business_name || "—"}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="rounded-lg bg-muted p-2">
                     <Clock className="h-4 w-4 text-muted-foreground" />
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Business Age</p>
                     <p className="font-medium">
                       {application.business_age_months
                         ? `${application.business_age_months} months`
                         : "—"}
                     </p>
                   </div>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="rounded-lg bg-muted p-2">
                     <IndianRupee className="h-4 w-4 text-muted-foreground" />
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                     <p className="font-medium">{formatAmount(application.monthly_revenue)}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="rounded-lg bg-muted p-2">
                     <FileText className="h-4 w-4 text-muted-foreground" />
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Industry</p>
                     <p className="font-medium capitalize">{application.industry || "—"}</p>
                   </div>
                 </div>
               </CardContent>
             </Card>
 
             {/* Loan Details */}
             <Card className="shadow-card">
               <CardHeader>
                 <CardTitle className="text-base">Loan Request</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="flex items-center gap-3">
                   <div className="rounded-lg bg-primary/10 p-2">
                     <FileText className="h-4 w-4 text-primary" />
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Loan Type</p>
                     <p className="font-medium">{formatLoanType(application.loan_type)}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="rounded-lg bg-primary/10 p-2">
                     <IndianRupee className="h-4 w-4 text-primary" />
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Requested Amount</p>
                     <p className="font-medium">{formatAmount(application.requested_amount)}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="rounded-lg bg-primary/10 p-2">
                     <Calendar className="h-4 w-4 text-primary" />
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Submitted</p>
                     <p className="font-medium">
                       {application.submitted_at
                         ? format(new Date(application.submitted_at), "MMM d, yyyy 'at' h:mm a")
                         : "—"}
                     </p>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </div>
         </div>
       </div>
     </DashboardLayout>
   );
 }