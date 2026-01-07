import { Lightbulb, RefreshCw } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent, GlassCardDescription } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import type { WriterMode } from "../types";

interface ModeSelectorProps {
    onSelectMode: (mode: WriterMode) => void;
}

export function ModeSelector({ onSelectMode }: ModeSelectorProps) {
    return (
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <GlassCard
                className="cursor-pointer hover:border-primary/50 transition-all hover:scale-[1.02]"
                onClick={() => onSelectMode("new-idea")}
            >
                <GlassCardHeader>
                    <GlassCardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                        New Idea
                    </GlassCardTitle>
                    <GlassCardDescription>
                        Create a script from scratch with your topic and key points
                    </GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent>
                    <Button className="w-full">Start Fresh</Button>
                </GlassCardContent>
            </GlassCard>

            <GlassCard
                className="cursor-pointer hover:border-primary/50 transition-all hover:scale-[1.02]"
                onClick={() => onSelectMode("rewrite")}
            >
                <GlassCardHeader>
                    <GlassCardTitle className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 text-blue-500" />
                        Rewrite
                    </GlassCardTitle>
                    <GlassCardDescription>
                        Transform an existing script with your unique style
                    </GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent>
                    <Button variant="outline" className="w-full">Rewrite Script</Button>
                </GlassCardContent>
            </GlassCard>
        </div>
    );
}
