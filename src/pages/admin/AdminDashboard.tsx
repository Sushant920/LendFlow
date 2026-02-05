 import { useEffect, useState } from "react";
 import { Link } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
 import { DashboardLayout } from "@/components/layout/DashboardLayout";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { StatusBadge } from "@/components/StatusBadge";
 import { RiskScoreGauge } from "@/components/RiskScoreGauge";
 import {
   Users,
   FileText,
   CheckCircle2,
   Clock,
   XCircle,
   ArrowRight,
   TrendingUp,
 } from "lucide-react";
 import { format } from "date-fns";
 
 interface DashboardStats {
   totalMerchants: number;
   totalApplications: number;
   pendingApplications: number;
   approvedApplications: number;
   rejectedApplications: number;
   averageRiskScore: number;
 }
 
 interface RecentApplication {
   id: string;
   loan_type: "working_capital" | "term_loan";
   status: "draft" | "submitted" | "under_review" | "approved" | "rejected" | "requires_info";
   business_name: string | null;
   risk_score: number | null;
   created_at: string;
   profiles: { email: string; company_name: string | null } | null;
 }
 
 export default function AdminDashboard() {
   const [stats, setStats] = useState<DashboardStats>({
     totalMerchants: 0,
     totalApplications: 0,
     pendingApplications: 0,
     approvedApplications: 0,
     rejectedApplications: 0,
     averageRiskScore: 0,
   });
   const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     fetchDashboardData();
   }, []);
 
   const fetchDashboardData = async () => {
     // Fetch merchants count
     const { count: merchantCount } = await supabase
       .from("user_roles")
       .select("*", { count: "exact", head: true })
       .eq("role", "merchant");
 
     // Fetch applications
     const { data: applications } = await supabase
       .from("loan_applications")
       .select("*");
 
     if (applications) {
       const pending = applications.filter((a) =>
         ["submitted", "under_review", "requires_info"].includes(a.status)
       ).length;
       const approved = applications.filter((a) => a.status === "approved").length;
       const rejected = applications.filter((a) => a.status === "rejected").length;
       const scoresWithValue = applications.filter((a) => a.risk_score !== null);
       const avgScore =
         scoresWithValue.length > 0
           ? Math.round(
               scoresWithValue.reduce((sum, a) => sum + (a.risk_score || 0), 0) /
                 scoresWithValue.length
             )
           : 0;
 
       setStats({
         totalMerchants: merchantCount || 0,
         totalApplications: applications.length,
         pendingApplications: pending,
         approvedApplications: approved,
         rejectedApplications: rejected,
         averageRiskScore: avgScore,
       });
     }
 
     // Fetch recent applications with user info
     const { data: recent } = await supabase
       .from("loan_applications")
       .select(`
         id,
         loan_type,
         status,
         business_name,
         risk_score,
         created_at,
         profiles:user_id (email, company_name)
       `)
       .order("created_at", { ascending: false })
       .limit(5);
 
     if (recent) {
       setRecentApplications(recent as unknown as RecentApplication[]);
     }
 
     setLoading(false);
   };
 
   const formatLoanType = (type: string) => {
     return type === "working_capital" ? "Working Capital" : "Term Loan";
   };
 
   return (
     <DashboardLayout>
       <div className="space-y-8">
         {/* Header */}
         <div>
           <h1 className="text-2xl font-bold lg:text-3xl">Admin Dashboard</h1>
           <p className="text-muted-foreground">
             Overview of merchants, applications, and risk metrics.
           </p>
         </div>
 
         {/* Stats Grid */}
         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
           <Card className="shadow-card">
             <CardContent className="flex items-center gap-4 p-6">
               <div className="rounded-lg bg-primary/10 p-3">
                 <Users className="h-6 w-6 text-primary" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Merchants</p>
                 <p className="text-2xl font-bold">{stats.totalMerchants}</p>
               </div>
             </CardContent>
           </Card>
           <Card className="shadow-card">
             <CardContent className="flex items-center gap-4 p-6">
               <div className="rounded-lg bg-info/10 p-3">
                 <FileText className="h-6 w-6 text-info" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Applications</p>
                 <p className="text-2xl font-bold">{stats.totalApplications}</p>
               </div>
             </CardContent>
           </Card>
           <Card className="shadow-card">
             <CardContent className="flex items-center gap-4 p-6">
               <div className="rounded-lg bg-warning/10 p-3">
                 <Clock className="h-6 w-6 text-warning" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Pending</p>
                 <p className="text-2xl font-bold">{stats.pendingApplications}</p>
               </div>
             </CardContent>
           </Card>
           <Card className="shadow-card">
             <CardContent className="flex items-center gap-4 p-6">
               <div className="rounded-lg bg-success/10 p-3">
                 <CheckCircle2 className="h-6 w-6 text-success" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Approved</p>
                 <p className="text-2xl font-bold">{stats.approvedApplications}</p>
               </div>
             </CardContent>
           </Card>
           <Card className="shadow-card">
             <CardContent className="flex items-center gap-4 p-6">
               <div className="rounded-lg bg-destructive/10 p-3">
                 <XCircle className="h-6 w-6 text-destructive" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Rejected</p>
                 <p className="text-2xl font-bold">{stats.rejectedApplications}</p>
               </div>
             </CardContent>
           </Card>
           <Card className="shadow-card">
             <CardContent className="flex items-center gap-4 p-6">
               <div className="rounded-lg bg-accent/10 p-3">
                 <TrendingUp className="h-6 w-6 text-accent" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Avg Score</p>
                 <p className="text-2xl font-bold">{stats.averageRiskScore}</p>
               </div>
             </CardContent>
           </Card>
         </div>
 
         {/* Recent Applications */}
         <Card className="shadow-card">
           <CardHeader className="flex flex-row items-center justify-between">
             <div>
               <CardTitle>Recent Applications</CardTitle>
               <CardDescription>
                 Latest loan applications from merchants
               </CardDescription>
             </div>
             <Link
               to="/admin/applications"
               className="text-sm font-medium text-primary hover:underline"
             >
               View all
             </Link>
           </CardHeader>
           <CardContent>
             {loading ? (
               <div className="flex items-center justify-center py-8">
                 <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
               </div>
             ) : recentApplications.length === 0 ? (
               <p className="py-8 text-center text-muted-foreground">
                 No applications yet
               </p>
             ) : (
               <div className="space-y-4">
                 {recentApplications.map((app) => (
                   <Link
                     key={app.id}
                     to={`/admin/applications/${app.id}`}
                     className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                   >
                     <div className="flex items-center gap-4">
                       {app.risk_score !== null ? (
                         <RiskScoreGauge score={app.risk_score} size="sm" showLabel={false} />
                       ) : (
                         <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                           <Clock className="h-6 w-6 text-muted-foreground" />
                         </div>
                       )}
                       <div>
                         <p className="font-medium">
                           {app.business_name || app.profiles?.company_name || "Unnamed"}
                         </p>
                         <p className="text-sm text-muted-foreground">
                           {formatLoanType(app.loan_type)} •{" "}
                           {format(new Date(app.created_at), "MMM d, yyyy")}
                         </p>
                         <p className="text-xs text-muted-foreground">
                           {app.profiles?.email}
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