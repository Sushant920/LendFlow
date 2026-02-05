 import { useEffect, useState } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { DashboardLayout } from "@/components/layout/DashboardLayout";
 import { Card, CardContent } from "@/components/ui/card";
 import { Input } from "@/components/ui/input";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import { Search, User } from "lucide-react";
 import { format } from "date-fns";
 
 interface Merchant {
   id: string;
   user_id: string;
   email: string;
   full_name: string | null;
   company_name: string | null;
   created_at: string;
   application_count: number;
 }
 
 export default function AdminMerchants() {
   const [merchants, setMerchants] = useState<Merchant[]>([]);
   const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState("");
 
   useEffect(() => {
     fetchMerchants();
   }, []);
 
   const fetchMerchants = async () => {
     // Get all merchant profiles
     const { data: profiles, error } = await supabase
       .from("profiles")
       .select(`
         id,
         user_id,
         email,
         full_name,
         company_name,
         created_at
       `)
       .order("created_at", { ascending: false });
 
     if (!error && profiles) {
       // Get application counts
       const merchantData: Merchant[] = await Promise.all(
         profiles.map(async (profile) => {
           const { count } = await supabase
             .from("loan_applications")
             .select("*", { count: "exact", head: true })
             .eq("user_id", profile.user_id);
 
           return {
             ...profile,
             application_count: count || 0,
           };
         })
       );
 
       setMerchants(merchantData);
     }
     setLoading(false);
   };
 
   const filteredMerchants = merchants.filter((merchant) => {
     return (
       merchant.email?.toLowerCase().includes(search.toLowerCase()) ||
       merchant.full_name?.toLowerCase().includes(search.toLowerCase()) ||
       merchant.company_name?.toLowerCase().includes(search.toLowerCase())
     );
   });
 
   return (
     <DashboardLayout>
       <div className="space-y-6">
         {/* Header */}
         <div>
           <h1 className="text-2xl font-bold lg:text-3xl">Merchants</h1>
           <p className="text-muted-foreground">
             View and manage all registered merchants.
           </p>
         </div>
 
         {/* Search */}
         <Card className="shadow-card">
           <CardContent className="p-4">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
               <Input
                 placeholder="Search by name, company, or email..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="pl-10"
               />
             </div>
           </CardContent>
         </Card>
 
         {/* Merchants Table */}
         <Card className="shadow-card">
           <CardContent className="p-0">
             {loading ? (
               <div className="flex items-center justify-center py-12">
                 <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
               </div>
             ) : filteredMerchants.length === 0 ? (
               <div className="py-12 text-center text-muted-foreground">
                 No merchants found
               </div>
             ) : (
               <div className="overflow-x-auto">
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Merchant</TableHead>
                       <TableHead>Company</TableHead>
                       <TableHead>Email</TableHead>
                       <TableHead>Applications</TableHead>
                       <TableHead>Joined</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {filteredMerchants.map((merchant) => (
                       <TableRow key={merchant.id}>
                         <TableCell>
                           <div className="flex items-center gap-3">
                             <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                               <User className="h-5 w-5 text-primary" />
                             </div>
                             <span className="font-medium">
                               {merchant.full_name || "—"}
                             </span>
                           </div>
                         </TableCell>
                         <TableCell>{merchant.company_name || "—"}</TableCell>
                         <TableCell className="text-muted-foreground">
                           {merchant.email}
                         </TableCell>
                         <TableCell>
                           <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary">
                             {merchant.application_count}
                           </span>
                         </TableCell>
                         <TableCell className="text-muted-foreground">
                           {format(new Date(merchant.created_at), "MMM d, yyyy")}
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