import { useState, useEffect } from "react";
import { Cpu, ArrowRight, ArrowLeft, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useTubeCloneContext } from "../context";
import type { TubeCloneProject } from "../types";
import { generateEmbeddings } from "@/lib/embeddings";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useToast } from "@/hooks/use-toast";

interface StepEmbedProps {
    project: TubeCloneProject;
    onNext: () => void;
    onBack: () => void;
    autoStart?: boolean;
}

export function StepEmbed({ project, onNext, onBack, autoStart = true }: StepEmbedProps) {
    const { videos, updateProject, saveVideos } = useTubeCloneContext();
    const { settings, loading: settingsLoading } = useUserSettings();
    const { toast } = useToast();

    const [phase, setPhase] = useState<"idle" | "embedding" | "completed" | "error">("idle");
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("");

    // Videos that are missing embeddings
    const videosWithoutEmbedding = videos.filter(v => !v.embedding);
    const totalVideos = videos.length;

    useEffect(() => {
        // If no videos need embedding but we have videos, assume done
        if (videosWithoutEmbedding.length === 0 && totalVideos > 0 && phase === "idle") {
            setPhase("completed");
        } else if (autoStart && phase === "idle" && videosWithoutEmbedding.length > 0 && !settingsLoading && settings?.openrouter_api_key) {
            // Auto-start if we have videos to process AND we have the key
            handleStartEmbedding();
        }
    }, [videosWithoutEmbedding.length, totalVideos, autoStart, settingsLoading, settings?.openrouter_api_key, phase]);

    const handleStartEmbedding = async (forceString?: boolean | React.MouseEvent) => {
        // Handle forced restart
        const force = typeof forceString === 'boolean' ? forceString : false;

        // If already running, don't restart
        if (phase === "embedding") return;

        // If completed and not forced, don't restart
        if (phase === "completed" && !force) return;

        // Check key again just in case
        const apiKey = settings?.openrouter_api_key;
        if (!apiKey) {
            if (!settingsLoading) {
                setPhase("error");
                toast({
                    title: "Error",
                    description: "OpenRouter API Key is required for embeddings. Please add it in Settings.",
                    variant: "destructive",
                });
            }
            return;
        }

        setPhase("embedding");
        setProgress(0);
        setStatusText("Initializing embedding process...");

        try {
            const batchSize = 5;
            // If forced, process ALL videos. If not, only missing ones.
            const videosToProcess = force ? videos : videosWithoutEmbedding;
            const total = videosToProcess.length;

            if (total === 0) {
                setPhase("completed");
                return;
            }

            for (let i = 0; i < total; i += batchSize) {
                const batch = videosToProcess.slice(i, i + batchSize);
                setStatusText(`Embedding batch ${Math.ceil((i + 1) / batchSize)} of ${Math.ceil(total / batchSize)}...`);

                const texts = batch.map(v => {
                    const tags = v.tags ? v.tags.join(", ") : "";
                    return `Title: ${v.title || ""}\nDescription: ${v.description || ""}\nTags: ${tags}`;
                });

                // Generate embeddings
                const embeddings = await generateEmbeddings(texts, apiKey);

                // Prepare updates
                const updates = batch.map((v, idx) => ({
                    ...v, // Spread existing properties to satisfy upsert
                    embedding: embeddings[idx].embedding, // FIXED: access .embedding property
                }));

                // Save batch
                await saveVideos(project.id, updates);

                setProgress(((i + batchSize) / total) * 100);
            }

            await updateProject(project.id, { status: "analyzing" });
            setPhase("completed");
            setProgress(100);
            setStatusText("Embedding generation complete!");

            toast({
                title: "Success",
                description: `Generated embeddings for ${total} videos`,
            });

        } catch (error) {
            console.error("Embedding error:", error);
            setPhase("error");
            setStatusText("Failed to generate embeddings. Check console for details.");
            toast({
                title: "Error",
                description: "An error occurred while generating embeddings",
                variant: "destructive",
            });
        }
    };

    return (
        <GlassCard variant="elevated">
            <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-2">
                    <Cpu className="h-5 w-5" />
                    Generate Video Embeddings
                </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-6">
                <div className="flex gap-4 text-sm">
                    <Badge variant="outline">Total Videos: {totalVideos}</Badge>
                    <Badge variant="outline" className="text-amber-600">Pending: {videosWithoutEmbedding.length}</Badge>
                    <Badge variant="outline" className="text-green-600">Ready: {totalVideos - videosWithoutEmbedding.length}</Badge>
                </div>

                {phase === "idle" && videosWithoutEmbedding.length > 0 && (
                    <div className="text-center py-8">
                        <Cpu className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground mb-4">
                            Analyze video content semantics to find deep patterns.
                            <br />
                            This requires OpenRouter API key.
                        </p>
                        <Button onClick={handleStartEmbedding} size="lg" className="gap-2">
                            <Cpu className="h-4 w-4" />
                            Start Embedding Generation
                        </Button>
                    </div>
                )}

                {phase === "embedding" && (
                    <div className="space-y-4 py-8">
                        <Progress value={progress} className="h-2" />
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {statusText}
                        </div>
                    </div>
                )}

                {phase === "completed" && (
                    <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                        <h3 className="text-lg font-medium mb-2">Embeddings Ready</h3>
                        <p className="text-muted-foreground mb-4">
                            All videos have been processed and are ready for analysis.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStartEmbedding(true)}
                            className="mt-2"
                        >
                            <Cpu className="h-4 w-4 mr-2" />
                            Regenerate Embeddings
                        </Button>
                    </div>
                )}

                {phase === "error" && (
                    <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
                        <h3 className="text-lg font-medium mb-2 text-destructive">Process Failed</h3>
                        <p className="text-muted-foreground mb-4">
                            There was an error generating embeddings. Check your API key and connection.
                        </p>
                        <Button onClick={handleStartEmbedding} variant="outline">
                            Retry
                        </Button>
                    </div>
                )}

                <div className="flex justify-between pt-4 border-t">
                    <Button variant="outline" onClick={onBack} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <Button
                        onClick={onNext}
                        disabled={phase !== "completed"}
                        className="gap-2"
                    >
                        Continue
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </GlassCardContent>
        </GlassCard>
    );
}
