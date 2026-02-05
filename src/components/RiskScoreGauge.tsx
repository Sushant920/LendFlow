 import { cn } from "@/lib/utils";
 
 interface RiskScoreGaugeProps {
   score: number;
   size?: "sm" | "md" | "lg";
   showLabel?: boolean;
 }
 
 export function RiskScoreGauge({ score, size = "md", showLabel = true }: RiskScoreGaugeProps) {
   const getColor = (score: number) => {
     if (score >= 70) return "text-success";
     if (score >= 40) return "text-warning";
     return "text-destructive";
   };
 
   const getLabel = (score: number) => {
     if (score >= 70) return "Low Risk";
     if (score >= 40) return "Medium Risk";
     return "High Risk";
   };
 
   const getBgColor = (score: number) => {
     if (score >= 70) return "bg-success/10";
     if (score >= 40) return "bg-warning/10";
     return "bg-destructive/10";
   };
 
   const sizeClasses = {
     sm: "h-16 w-16 text-lg",
     md: "h-24 w-24 text-2xl",
     lg: "h-32 w-32 text-3xl",
   };
 
   const circumference = 2 * Math.PI * 45;
   const strokeDashoffset = circumference - (score / 100) * circumference;
 
   return (
     <div className="flex flex-col items-center gap-2">
       <div className={cn("relative", sizeClasses[size])}>
         <svg className="h-full w-full -rotate-90 transform">
           <circle
             cx="50%"
             cy="50%"
             r="45%"
             fill="none"
             stroke="currentColor"
             strokeWidth="8"
             className="text-muted"
           />
           <circle
             cx="50%"
             cy="50%"
             r="45%"
             fill="none"
             stroke="currentColor"
             strokeWidth="8"
             strokeLinecap="round"
             strokeDasharray={circumference}
             strokeDashoffset={strokeDashoffset}
             className={cn("transition-all duration-1000", getColor(score))}
           />
         </svg>
         <div className="absolute inset-0 flex items-center justify-center">
           <span className={cn("font-bold", getColor(score))}>{score}</span>
         </div>
       </div>
       {showLabel && (
         <span
           className={cn(
             "rounded-full px-3 py-1 text-xs font-medium",
             getBgColor(score),
             getColor(score)
           )}
         >
           {getLabel(score)}
         </span>
       )}
     </div>
   );
 }