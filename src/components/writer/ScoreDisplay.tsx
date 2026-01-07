import { Star, TrendingUp, MessageSquare, Zap, Target } from "lucide-react";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { ScoreResult } from "@/lib/script-generator";

interface ScoreDisplayProps {
  score: ScoreResult;
}

export function ScoreDisplay({ score }: ScoreDisplayProps) {
  const getScoreColor = (value: number) => {
    if (value >= 80) return "text-green-500";
    if (value >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getProgressColor = (value: number) => {
    if (value >= 80) return "bg-green-500";
    if (value >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const categories = [
    { key: "hook", label: "Hook", icon: Zap, value: score.breakdown.hook },
    { key: "structure", label: "Structure", icon: Target, value: score.breakdown.structure },
    { key: "engagement", label: "Engagement", icon: TrendingUp, value: score.breakdown.engagement },
    { key: "clarity", label: "Clarity", icon: MessageSquare, value: score.breakdown.clarity },
    { key: "callToAction", label: "CTA", icon: Star, value: score.breakdown.callToAction },
  ];

  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Script Score
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-3xl font-bold ${getScoreColor(score.score)}`}>
              {score.score}
            </span>
            <span className="text-muted-foreground">/100</span>
          </div>
        </GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent className="space-y-4">
        {/* Score breakdown */}
        <div className="grid gap-3">
          {categories.map(({ key, label, icon: Icon, value }) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span>{label}</span>
                </div>
                <span className={`font-medium ${getScoreColor(value)}`}>{value}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${getProgressColor(value)}`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Suggestions */}
        {score.suggestions && score.suggestions.length > 0 && (
          <div className="pt-3 border-t border-border/50 space-y-2">
            <span className="text-sm font-medium">Suggestions</span>
            <ul className="space-y-1">
              {score.suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}
