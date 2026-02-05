 import { useEffect, useState } from "react";
 import { Link } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
 import { DashboardLayout } from "@/components/layout/DashboardLayout";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import { StatusBadge } from "@/components/StatusBadge";
 import { RiskScoreGauge } from "@/components/RiskScoreGauge";
 import { Search, ArrowRight } from "lucide-react";
 import { format } from "date-fns";
 
 interface Application {
   id: string;
   loan_type: "working_capital" | "term_loan";
   status: "draft" | "submitted" | "under_review" | "approved" | "rejected" | "requires_info";
   requested_amount: number | null;
   business_name: string | null;
   risk_score: number | null;
   created_at: string;
   profiles: { email: string; company_name: string | null } | null;
 }
 
 export default function AdminApplications() {
   const [applications, setApplications] = useState<Application[]>([]);
   const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState("");
   const [statusFilter, setStatusFilter] = useState<string>("all");
 
   useEffect(() => {
     fetchApplications();
   }, []);
 
   const fetchApplications = async () => {
     const { data, error } = await supabase
       .from("loan_applications")
       .select(`
         id,
         loan_type,
         status,
         requested_amount,
         business_name,
         risk_score,
         created_at,
         profiles:user_id (email, company_name)
       `)
       .order("created_at", { ascending: false });
 
     if (!error && data) {
       setApplications(data as unknown as Application[]);
     }
     setLoading(false);
   };
 
   const filteredApplications = applications.filter((app) => {
     const matchesSearch =
       app.business_name?.toLowerCase().includes(search.toLowerCase()) ||
       app.profiles?.email?.toLowerCase().includes(search.toLowerCase()) ||
       app.profiles?.company_name?.toLowerCase().includes(search.toLowerCase());
 
     const matchesStatus = statusFilter === "all" || app.status === statusFilter;
 
     return matchesSearch && matchesStatus;
   });
 
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
 
   return (
     <DashboardLayout>
       <div className="space-y-6">
         {/* Header */}
         <div>
           <h1 className="text-2xl font-bold lg:text-3xl">All Applications</h1>
           <p className="text-muted-foreground">
             Review and manage loan applications from all merchants.
           </p>
         </div>
 
         {/* Filters */}
         <Card className="shadow-card">
           <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
               <Input
                 placeholder="Search by business name or email..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="pl-10"
               />
             </div>
             <Select value={statusFilter} onValueChange={setStatusFilter}>
               <SelectTrigger className="w-full sm:w-[180px]">
                 <SelectValue placeholder="Filter by status" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All Statuses</SelectItem>
                 <SelectItem value="submitted">Submitted</SelectItem>
                 <SelectItem value="under_review">Under Review</SelectItem>
                 <SelectItem value="approved">Approved</SelectItem>
                 <SelectItem value="rejected">Rejected</SelectItem>
                 <SelectItem value="requires_info">Info Required</SelectItem>
               </SelectContent>
             </Select>
           </CardContent>
         </Card>
 
         {/* Applications Table */}
         <Card className="shadow-card">
           <CardContent className="p-0">
             {loading ? (
               <div className="flex items-center justify-center py-12">
                 <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
               </div>
             ) : filteredApplications.length === 0 ? (
               <div className="py-12 text-center text-muted-foreground">
                 No applications found
               </div>
             ) : (
               <div className="overflow-x-auto">
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Business</TableHead>
                       <TableHead>Loan Type</TableHead>
                       <TableHead>Amount</TableHead>
                       <TableHead>Risk Score</TableHead>
                       <TableHead>Status</TableHead>
                       <TableHead>Date</TableHead>
                       <TableHead className="w-12"></TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {filteredApplications.map((app) => (
                       <TableRow key={app.id}>
                         <TableCell>
                           <div>
                             <p className="font-medium">
                               {app.business_name || app.profiles?.company_name || "Unnamed"}
                             </p>
                             <p className="text-sm text-muted-foreground">
                               {app.profiles?.email}
                             </p>
                           </div>
                         </TableCell>
                         <TableCell>{formatLoanType(app.loan_type)}</TableCell>
                         <TableCell>{formatAmount(app.requested_amount)}</TableCell>
                         <TableCell>
                           {app.risk_score !== null ? (
                             <RiskScoreGauge score={app.risk_score} size="sm" showLabel={false} />
                           ) : (
                             <span className="text-muted-foreground">—</span>
                           )}
                         </TableCell>
                         <TableCell>
                           <StatusBadge status={app.status} />
                         </TableCell>
                         <TableCell className="text-muted-foreground">
                           {format(new Date(app.created_at), "MMM d, yyyy")}
                         </TableCell>
                         <TableCell>
                           <Button variant="ghost" size="icon" asChild>
                             <Link to={`/admin/applications/${app.id}`}>
                               <ArrowRight className="h-4 w-4" />
                             </Link>
                           </Button>
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </div>
             )}
           </CardContent>
         </Card>
       </div>
     </DashboardLayout>
   );
 }