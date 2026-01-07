import { LucideIcon, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";

interface QuickActionProps {
  title: string;
  description: string;
  icon: LucideIcon;
  to: string;
  gradient?: string;
}

export function QuickAction({ title, description, icon: Icon, to, gradient }: QuickActionProps) {
  return (
    <Link to={to} className="group block">
      <GlassCard variant="elevated" className="overflow-hidden">
        <GlassCardContent className="p-0">
          <div className={`p-6 ${gradient || "bg-gradient-to-br from-primary/5 to-primary/10"}`}>
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-card/80 p-3 shadow-sm backdrop-blur-sm">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
            </div>
            <div className="mt-4 space-y-1">
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>
    </Link>
  );
}
