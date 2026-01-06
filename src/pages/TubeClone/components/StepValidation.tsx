import { CheckCircle, ArrowLeft, Copy, Sparkles } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTubeCloneContext } from "../context";
import type { TubeCloneProject } from "../types";
import { useToast } from "@/hooks/use-toast";

interface StepValidationProps {
    project: TubeCloneProject;
    userInput: any;
    onBack: () => void;
}

export function StepValidation({ project, userInput, onBack }: StepValidationProps) {
    const { analysis } = useTubeCloneContext();
    const { toast } = useToast();

    if (!analysis) return null;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied!", description: "Content copied to clipboard" });
    };

    return (
        <div className="space-y-6">
            <GlassCard variant="elevated">
                <GlassCardHeader>
                    <GlassCardTitle className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-6 w-6" />
                        Validation Complete
                    </GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 mb-6">
                        <h3 className="font-semibold text-green-700 mb-1">Ready for Production</h3>
                        <p className="text-sm text-green-600/80">
                            Your concept has been optimized based on {analysis.top_video_ids?.length || 0} top-performing competitor videos.
                        </p>
                    </div>

                    <div className="space-y-4 mt-4">
                            {/* Titles */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                    <Sparkles className="h-3 w-3 text-primary" />
                                    Optimized Titles
                                </h4>
                                <div className="grid gap-2">
                                    {analysis.suggestions?.titleVariants.map((title, idx) => (
                                        <div key={idx} className="flex gap-2 items-center p-3 rounded bg-muted/50 border group hover:border-primary/50 transition-colors">
                                            <div className="font-medium text-sm flex-1">{title}</div>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => copyToClipboard(title)}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                    <Sparkles className="h-3 w-3 text-primary" />
                                    Optimized Description
                                </h4>
                                <div className="relative p-4 rounded bg-muted/50 border min-h-[100px] text-sm whitespace-pre-wrap group">
                                    {analysis.suggestions?.optimizedDescription}
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100"
                                        onClick={() => copyToClipboard(analysis.suggestions?.optimizedDescription || "")}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                    <Sparkles className="h-3 w-3 text-primary" />
                                    Recommended Tags
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.suggestions?.suggestedTags.map((tag, idx) => (
                                        <Badge key={idx} variant="secondary" className="px-2 py-1 cursor-pointer hover:bg-primary/20" onClick={() => copyToClipboard(tag)}>
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                    </div>
                </GlassCardContent>
            </GlassCard>

            <div className="flex justify-start">
                <Button variant="outline" onClick={onBack} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Analysis
                </Button>
            </div>
        </div>
    );
}
