import { Sparkles, Clock } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent, GlassCardDescription } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your preferences</p>
      </div>

      {/* AI Model Selection - Coming Soon */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Model
            <Badge variant="secondary" className="ml-2">
              <Clock className="h-3 w-3 mr-1" />
              Coming Soon
            </Badge>
          </GlassCardTitle>
          <GlassCardDescription>
            Model selection is now available at each step (DNA extraction, Outline, Script generation)
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="text-sm text-muted-foreground bg-muted/50 rounded-xl p-4">
            <p className="font-medium mb-2">✨ Per-step model selection</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>DNA Lab: Select model when extracting DNA</li>
              <li>Writer Input: Select model for outline generation</li>
              <li>Writer Outline: Select model for script writing</li>
              <li>Persona: Select model for persona generation</li>
            </ul>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
