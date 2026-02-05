 import { cn } from "@/lib/utils";
 
 type Status = "draft" | "submitted" | "under_review" | "approved" | "rejected" | "requires_info";
 
 interface StatusBadgeProps {
   status: Status;
   className?: string;
 }
 
 const statusConfig: Record<Status, { label: string; className: string }> = {
   draft: {
     label: "Draft",
     className: "bg-muted text-muted-foreground",
   },
   submitted: {
     label: "Submitted",
     className: "bg-info/10 text-info",
   },
   under_review: {
     label: "Under Review",
     className: "bg-warning/10 text-warning",
   },
   approved: {
     label: "Approved",
     className: "bg-success/10 text-success",
   },
   rejected: {
     label: "Rejected",
     className: "bg-destructive/10 text-destructive",
   },
   requires_info: {
     label: "Info Required",
     className: "bg-warning/10 text-warning",
   },
 };
 
 export function StatusBadge({ status, className }: StatusBadgeProps) {
   const config = statusConfig[status];
   
   return (
     <span
       className={cn(
         "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
         config.className,
         className
       )}
     >
       {config.label}
     </span>
   );
 }