import * as React from "react";
import { cn } from "@/lib/utils";
interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "subtle";
}
const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(({
  className,
  variant = "default",
  ...props
}, ref) => {
  return <div ref={ref} className={cn("rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 overflow-hidden", variant === "default" && "shadow-sm hover:shadow-md", variant === "elevated" && "shadow-md hover:shadow-lg hover:-translate-y-0.5", variant === "subtle" && "bg-card/50", className)} {...props} />;
});
GlassCard.displayName = "GlassCard";
const GlassCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  className,
  ...props
}, ref) => <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />);
GlassCardHeader.displayName = "GlassCardHeader";
const GlassCardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({
  className,
  ...props
}, ref) => <h3 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />);
GlassCardTitle.displayName = "GlassCardTitle";
const GlassCardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({
  className,
  ...props
}, ref) => <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />);
GlassCardDescription.displayName = "GlassCardDescription";
const GlassCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  className,
  ...props
}, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />);
GlassCardContent.displayName = "GlassCardContent";
export { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent };