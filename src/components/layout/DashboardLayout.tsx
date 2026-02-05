 import { ReactNode } from "react";
 import { Link, useLocation, useNavigate } from "react-router-dom";
 import { useAuth } from "@/hooks/useAuth";
 import { Button } from "@/components/ui/button";
 import {
   LayoutDashboard,
   FileText,
   Users,
   Settings,
   LogOut,
   Building2,
   Menu,
   X,
   ChevronRight,
 } from "lucide-react";
 import { useState } from "react";
 import { cn } from "@/lib/utils";
 
 interface DashboardLayoutProps {
   children: ReactNode;
 }
 
 const merchantNavItems = [
   { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
   { label: "Applications", href: "/applications", icon: FileText },
   { label: "Settings", href: "/settings", icon: Settings },
 ];
 
 const adminNavItems = [
   { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
   { label: "Merchants", href: "/admin/merchants", icon: Users },
   { label: "Applications", href: "/admin/applications", icon: FileText },
   { label: "Settings", href: "/admin/settings", icon: Settings },
 ];
 
 export function DashboardLayout({ children }: DashboardLayoutProps) {
   const { user, role, signOut } = useAuth();
   const location = useLocation();
   const navigate = useNavigate();
   const [sidebarOpen, setSidebarOpen] = useState(false);
 
   const navItems = role === "admin" ? adminNavItems : merchantNavItems;
 
   const handleSignOut = async () => {
     await signOut();
     navigate("/login");
   };
 
   return (
     <div className="min-h-screen bg-background">
       {/* Mobile Header */}
       <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-card px-4 lg:hidden">
         <div className="flex items-center gap-3">
           <Building2 className="h-7 w-7 text-primary" />
           <span className="text-lg font-semibold">LendFlow</span>
         </div>
         <Button
           variant="ghost"
           size="icon"
           onClick={() => setSidebarOpen(!sidebarOpen)}
         >
           {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
         </Button>
       </header>
 
       <div className="flex">
         {/* Sidebar */}
         <aside
           className={cn(
             "fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-card transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
             sidebarOpen ? "translate-x-0" : "-translate-x-full"
           )}
         >
           {/* Logo */}
           <div className="hidden h-16 items-center gap-3 border-b px-6 lg:flex">
             <Building2 className="h-7 w-7 text-primary" />
             <span className="text-lg font-semibold">LendFlow</span>
           </div>
 
           {/* Navigation */}
           <nav className="flex flex-col gap-1 p-4 pt-20 lg:pt-4">
             {navItems.map((item) => {
               const isActive = location.pathname === item.href;
               return (
                 <Link
                   key={item.href}
                   to={item.href}
                   onClick={() => setSidebarOpen(false)}
                   className={cn(
                     "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                     isActive
                       ? "bg-primary text-primary-foreground"
                       : "text-muted-foreground hover:bg-muted hover:text-foreground"
                   )}
                 >
                   <item.icon className="h-5 w-5" />
                   {item.label}
                 </Link>
               );
             })}
           </nav>
 
           {/* User section */}
           <div className="absolute bottom-0 left-0 right-0 border-t p-4">
             <div className="mb-3 rounded-lg bg-muted p-3">
               <p className="text-sm font-medium truncate">{user?.email}</p>
               <p className="text-xs text-muted-foreground capitalize">{role}</p>
             </div>
             <Button
               variant="ghost"
               className="w-full justify-start text-muted-foreground hover:text-foreground"
               onClick={handleSignOut}
             >
               <LogOut className="mr-2 h-4 w-4" />
               Sign out
             </Button>
           </div>
         </aside>
 
         {/* Backdrop for mobile */}
         {sidebarOpen && (
           <div
             className="fixed inset-0 z-30 bg-black/50 lg:hidden"
             onClick={() => setSidebarOpen(false)}
           />
         )}
 
         {/* Main Content */}
         <main className="flex-1 overflow-auto">
           <div className="container py-6 lg:py-8">{children}</div>
         </main>
       </div>
     </div>
   );
 }