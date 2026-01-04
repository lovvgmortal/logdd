import { LucideIcon } from "lucide-react";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
  return (
    <GlassCard variant="elevated" className="group">
      <GlassCardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-tight">{value}</p>
              {trend && (
                <span
                  className={`text-xs font-medium ${
                    trend.isPositive ? "text-emerald-600" : "text-destructive"
                  }`}
                >
                  {trend.isPositive ? "+" : ""}{trend.value}%
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="rounded-xl bg-primary/10 p-3 transition-transform duration-300 group-hover:scale-110">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
