import { LucideIcon } from "lucide-react";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";

interface CompactStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
}

export function CompactStatCard({ title, value, icon: Icon, iconColor = "text-primary" }: CompactStatCardProps) {
  return (
    <GlassCard className="h-full">
      <GlassCardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-muted/50 p-2">
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          <span className="text-sm text-muted-foreground">{title}</span>
        </div>
        <span className="text-2xl font-bold">{value}</span>
      </GlassCardContent>
    </GlassCard>
  );
}
