 import { useEffect, useState } from "react";
 import { Link, useNavigate } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/hooks/useAuth";
 import { DashboardLayout } from "@/components/layout/DashboardLayout";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { StatusBadge } from "@/components/StatusBadge";
 import { Plus, FileText, ArrowRight } from "lucide-react";
 import { format } from "date-fns";
 
 interface Application {
   id: string;
   loan_type: "working_capital" | "term_loan";
   status: "draft" | "submitted" | "under_review" | "approved" | "rejected" | "requires_info";
   requested_amount: number | null;
   business_name: string | null;
   created_at: string;
   risk_score: number | null;
 }
 
 export default function Applications() {
   const { user } = useAuth();
   const navigate = useNavigate();
   const [applications, setApplications] = useState<Application[]>([]);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     fetchApplications();
   }, [user]);
 
   const fetchApplications = async () => {
     if (!user) return;
 
     const { data, error } = await supabase
       .from("loan_applications")
       .select("*")
       .eq("user_id", user.id)
       .order("created_at", { ascending: false });
 
     if (!error && data) {
       setApplications(data as Application[]);
     }
     setLoading(false);
   };
 
   const formatLoanType = (type: string) => {
     return type === "working_capital" ? "Working Capital" : "Term Loan";
   };
 
   const formatAmount = (amount: number | null) => {
     if (!amount) return "—";
     return new Intl.NumberFormat("en-IN", {
       style: "currency",
       currency: "INR",
       maximumFractionDigits: 0,
     }).format(amount);
   };
 
   return (
     <DashboardLayout>
       <div className="space-y-6">
         {/* Header */}
         <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
           <div>
             <h1 className="text-2xl font-bold lg:text-3xl">My Applications</h1>
             <p className="text-muted-foreground">
               View and manage all your loan applications.
             </p>
           </div>
           <Button onClick={() => navigate("/apply")} className="gap-2">
             <Plus className="h-4 w-4" />
             New Application
           </Button>
         </div>
 
         {/* Applications List */}
         <Card className="shadow-card">
           <CardContent className="p-0">
             {loading ? (
               <div className="flex items-center justify-center py-12">
                 <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
               </div>
             ) : applications.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-12 text-center">
                 <div className="mb-4 rounded-full bg-muted p-4">
                   <FileText className="h-8 w-8 text-muted-foreground" />
                 </div>
                 <h3 className="mb-2 text-lg font-semibold">No applications yet</h3>
                 <p className="mb-4 max-w-sm text-muted-foreground">
                   Start your first loan application to access fast, flexible financing.
                 </p>
                 <Button onClick={() => navigate("/apply")}>
                   <Plus className="mr-2 h-4 w-4" />
                   Start Application
                 </Button>
               </div>
             ) : (
               <div className="divide-y">
                 {applications.map((app) => (
                   <Link
                     key={app.id}
                     to={app.status === "draft" ? `/apply?id=${app.id}` : `/applications/${app.id}`}
                     className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
                   >
                     <div className="flex items-center gap-4">
                       <div className="hidden rounded-lg bg-primary/10 p-2 sm:block">
                         <FileText className="h-5 w-5 text-primary" />
                       </div>
                       <div>
                         <p className="font-medium">
                           {formatLoanType(app.loan_type)}
                           {app.business_name && ` • ${app.business_name}`}
                         </p>
                         <p className="text-sm text-muted-foreground">
                           {formatAmount(app.requested_amount)} •{" "}
                           {format(new Date(app.created_at), "MMM d, yyyy")}
                         </p>
                       </div>
                     </div>
                     <div className="flex items-center gap-3">
                       <StatusBadge status={app.status} />
                       <ArrowRight className="h-4 w-4 text-muted-foreground" />
                     </div>
                   </Link>
                 ))}
               </div>
             )}
           </CardContent>
         </Card>
       </div>
     </DashboardLayout>
   );
 }