import { PenTool, ArrowRight, ArrowLeft } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTubeCloneContext } from "../context";
import type { TubeCloneProject } from "../types";

interface UserInputData {
    title: string;
    description: string;
    tags: string;
}

interface StepInputProps {
    project: TubeCloneProject;
    userInput: UserInputData;
    setUserInput: React.Dispatch<React.SetStateAction<UserInputData>>;
    onNext: () => void;
    onBack: () => void;
}

export function StepInput({ project, userInput, setUserInput, onNext, onBack }: StepInputProps) {
    const { updateProject } = useTubeCloneContext();

    const handleContinue = async () => {
        await updateProject(project.id, { status: "analyzing" });
        onNext();
    };

    return (
        <GlassCard variant="elevated">
            <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-2">
                    <PenTool className="h-5 w-5" />
                    Your Content Input
                </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Working Title</Label>
                        <Input
                            value={userInput.title}
                            onChange={(e) => setUserInput(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="E.g., How to make coding tutorials 2024"
                        />
                        <p className="text-xs text-muted-foreground">The draft title for your video.</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Description / Key Points</Label>
                        <Textarea
                            value={userInput.description}
                            onChange={(e) => setUserInput(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Briefly describe what your video is about, or bullet points of content..."
                            className="h-32"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Target Keywords / Tags (Optional)</Label>
                        <Input
                            value={userInput.tags}
                            onChange={(e) => setUserInput(prev => ({ ...prev, tags: e.target.value }))}
                            placeholder="coding, tutorial, devlog"
                        />
                        <p className="text-xs text-muted-foreground">Comma separated keywords you want to target.</p>
                    </div>
                </div>

                <div className="flex justify-between pt-4 border-t">
                    <Button variant="outline" onClick={onBack} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <Button
                        onClick={handleContinue}
                        disabled={!userInput.title.trim()}
                        className="gap-2"
                    >
                        Start Analysis
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </GlassCardContent>
        </GlassCard>
    );
}
