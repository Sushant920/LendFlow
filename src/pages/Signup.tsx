 import { useState } from "react";
 import { Link, useNavigate } from "react-router-dom";
 import { useAuth } from "@/hooks/useAuth";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
 import { useToast } from "@/hooks/use-toast";
 import { Loader2, Building2, ArrowRight, CheckCircle2 } from "lucide-react";
 
 export default function Signup() {
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [fullName, setFullName] = useState("");
   const [companyName, setCompanyName] = useState("");
   const [isLoading, setIsLoading] = useState(false);
   const [isSuccess, setIsSuccess] = useState(false);
   const { signUp } = useAuth();
   const navigate = useNavigate();
   const { toast } = useToast();
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setIsLoading(true);
 
     const { error } = await signUp(email, password, fullName, companyName);
 
     if (error) {
       toast({
         variant: "destructive",
         title: "Signup failed",
         description: error.message,
       });
       setIsLoading(false);
       return;
     }
 
     setIsSuccess(true);
   };
 
   if (isSuccess) {
     return (
       <div className="flex min-h-screen items-center justify-center bg-background p-8">
         <Card className="w-full max-w-md border-0 shadow-elevated text-center">
           <CardHeader className="space-y-4">
             <div className="flex justify-center">
               <div className="rounded-full bg-success/10 p-4">
                 <CheckCircle2 className="h-12 w-12 text-success" />
               </div>
             </div>
             <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
             <CardDescription className="text-base">
               We've sent a verification link to <strong>{email}</strong>. 
               Please click the link to verify your account.
             </CardDescription>
           </CardHeader>
           <CardFooter>
             <Button asChild className="w-full h-11">
               <Link to="/login">Back to login</Link>
             </Button>
           </CardFooter>
         </Card>
       </div>
     );
   }
 
   return (
     <div className="flex min-h-screen">
       {/* Left side - Branding */}
       <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12">
         <div className="max-w-md text-center">
           <div className="mb-8 flex justify-center">
             <div className="rounded-2xl bg-accent/20 p-4">
               <Building2 className="h-12 w-12 text-accent" />
             </div>
           </div>
           <h1 className="mb-4 text-4xl font-bold text-primary-foreground">
             LendFlow
           </h1>
           <p className="text-lg text-primary-foreground/80">
             Join thousands of businesses accessing fast, flexible financing with transparent terms.
           </p>
           <div className="mt-8 space-y-3 text-left">
             {[
               "Quick online application",
               "Decisions in minutes",
               "Competitive rates",
               "No hidden fees",
             ].map((feature) => (
               <div key={feature} className="flex items-center gap-3 text-primary-foreground/90">
                 <CheckCircle2 className="h-5 w-5 text-accent" />
                 <span>{feature}</span>
               </div>
             ))}
           </div>
         </div>
       </div>
 
       {/* Right side - Form */}
       <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
         <Card className="w-full max-w-md border-0 shadow-elevated">
           <CardHeader className="space-y-1 text-center">
             <div className="mb-4 flex justify-center lg:hidden">
               <div className="rounded-xl bg-primary/10 p-3">
                 <Building2 className="h-8 w-8 text-primary" />
               </div>
             </div>
             <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
             <CardDescription>
               Get started with your loan application today
             </CardDescription>
           </CardHeader>
           <form onSubmit={handleSubmit}>
             <CardContent className="space-y-4">
               <div className="space-y-2">
                 <Label htmlFor="fullName">Full Name</Label>
                 <Input
                   id="fullName"
                   type="text"
                   placeholder="John Smith"
                   value={fullName}
                   onChange={(e) => setFullName(e.target.value)}
                   required
                   className="h-11"
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="companyName">Company Name</Label>
                 <Input
                   id="companyName"
                   type="text"
                   placeholder="Acme Inc."
                   value={companyName}
                   onChange={(e) => setCompanyName(e.target.value)}
                   className="h-11"
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="email">Work Email</Label>
                 <Input
                   id="email"
                   type="email"
                   placeholder="name@company.com"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   required
                   className="h-11"
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="password">Password</Label>
                 <Input
                   id="password"
                   type="password"
                   placeholder="Create a strong password"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   required
                   minLength={6}
                   className="h-11"
                 />
               </div>
             </CardContent>
             <CardFooter className="flex flex-col gap-4">
               <Button type="submit" className="w-full h-11" disabled={isLoading}>
                 {isLoading ? (
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 ) : (
                   <>
                     Create account
                     <ArrowRight className="ml-2 h-4 w-4" />
                   </>
                 )}
               </Button>
               <p className="text-center text-sm text-muted-foreground">
                 Already have an account?{" "}
                 <Link to="/login" className="font-medium text-primary hover:underline">
                   Sign in
                 </Link>
               </p>
             </CardFooter>
           </form>
         </Card>
       </div>
     </div>
   );
 }