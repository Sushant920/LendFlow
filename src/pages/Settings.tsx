 import { useAuth } from "@/hooks/useAuth";
 import { DashboardLayout } from "@/components/layout/DashboardLayout";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { User, Mail, Building } from "lucide-react";
 
 export default function Settings() {
   const { user, role } = useAuth();
 
   return (
     <DashboardLayout>
       <div className="space-y-6">
         {/* Header */}
         <div>
           <h1 className="text-2xl font-bold lg:text-3xl">Settings</h1>
           <p className="text-muted-foreground">
             Manage your account and preferences.
           </p>
         </div>
 
         {/* Profile Card */}
         <Card className="shadow-card">
           <CardHeader>
             <CardTitle>Profile Information</CardTitle>
             <CardDescription>
               Your account details and preferences
             </CardDescription>
           </CardHeader>
           <CardContent className="space-y-6">
             <div className="flex items-center gap-4">
               <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                 <User className="h-8 w-8 text-primary" />
               </div>
               <div>
                 <p className="font-semibold">{user?.email}</p>
                 <p className="text-sm text-muted-foreground capitalize">{role} Account</p>
               </div>
             </div>
 
             <div className="grid gap-4 sm:grid-cols-2">
               <div className="space-y-2">
                 <Label htmlFor="email">Email</Label>
                 <div className="relative">
                   <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                   <Input
                     id="email"
                     value={user?.email || ""}
                     disabled
                     className="pl-10"
                   />
                 </div>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="role">Role</Label>
                 <div className="relative">
                   <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                   <Input
                     id="role"
                     value={role || ""}
                     disabled
                     className="pl-10 capitalize"
                   />
                 </div>
               </div>
             </div>
 
             <div className="rounded-lg border border-info/30 bg-info/5 p-4">
               <p className="text-sm text-info">
                 <strong>Note:</strong> Profile editing is available in the full version.
                 Contact support for account changes.
               </p>
             </div>
           </CardContent>
         </Card>
       </div>
     </DashboardLayout>
   );
 }