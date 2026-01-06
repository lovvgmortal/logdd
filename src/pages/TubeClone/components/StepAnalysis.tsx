import { useState, useEffect } from "react";
import { BarChart3, ArrowRight, ArrowLeft, Loader2, Target, Lightbulb, TrendingUp } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTubeCloneContext } from "../context";
import { formatNumber } from "@/lib/video-filter";
import type { TubeCloneProject } from "../types";
import { useUserSettings } from "@/hooks/useUserSettings";
import { generateEmbeddings, cosineSimilarity, findTopKSimilar } from "@/lib/embeddings";
import {
    extractPatterns,
    analyzeGaps,
    optimizeTitle,
    optimizeDescription,
    suggestTags
} from "@/lib/tubeclone-prompts";
import { ModelSelector } from "@/components/writer/ModelSelector";

interface StepAnalysisProps {
    project: TubeCloneProject;
    userInput: {
        title: string;
        description: string;
        tags: string;
    };
    onNext: () => void;
    onBack: () => void;
}

export function StepAnalysis({ project, userInput, onNext, onBack }: StepAnalysisProps) {
    const { videos, analysis, saveAnalysis, updateProject } = useTubeCloneContext();
    const { settings } = useUserSettings();

    const [selectedModel, setSelectedModel] = useState("google/gemini-3-flash-preview");
    const [phase, setPhase] = useState<"idle" | "analyzing" | "completed">("idle");
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("");

    useEffect(() => {
        // If analysis exists, mark as completed, but don't re-run analysis unless explicitly requested (phase idle)
        if (analysis && phase === "idle") {
            setPhase("completed");
        } else if (!analysis && phase === "idle" && videos.length > 0) {
            // Do NOT auto-start anymore, let user select model
            // handleStartAnalysis();
        }
    }, [analysis, phase, videos.length]);

    const handleStartAnalysis = async () => {
        const apiKey = settings?.openrouter_api_key;
        if (!apiKey) return;

        setPhase("analyzing");
        setProgress(0);

        try {
            // 1. Get user input embedding
            setStatusText("Analyzing your concept...");
            const userTagsArray = userInput.tags.split(",").map(t => t.trim()).filter(Boolean);
            const userText = `${userInput.title}\n${userInput.description}\n${userInput.tags}`;
            const [userEmbeddingResult] = await generateEmbeddings([userText], apiKey);
            const userEmbedding = userEmbeddingResult.embedding;
            setProgress(10);

            // 2. Find most relevant competitor videos
            setStatusText("Comparing with top competitors...");
            // Ensure videos have embeddings
            const validVideos = videos.filter(v => v.embedding && v.embedding.length > 0);

            // Helper to ensure embedding is number array
            const parseEmbedding = (emb: any): number[] | null => {
                if (!emb) return null;
                if (Array.isArray(emb)) return emb;
                if (typeof emb === 'string') {
                    try {
                        return JSON.parse(emb);
                    } catch (e) {
                        console.error("Failed to parse embedding string:", e);
                        return null;
                    }
                }
                return null;
            };

            // Calculate similarity scores for all videos
            const similarities = videos.map(v => {
                const videoEmbedding = parseEmbedding(v.embedding);
                if (!videoEmbedding) return { id: v.id, video: v, score: 0 };

                try {
                    const similarity = cosineSimilarity(userEmbedding, videoEmbedding);
                    return { id: v.id, video: v, score: similarity };
                } catch (err) {
                    console.warn(`Similarity error for video ${v.id}:`, err);
                    return { id: v.id, video: v, score: 0 };
                }
            }).sort((a, b) => b.score - a.score);

            const topCompetitors = similarities.slice(0, 10).map(s => s.video);

            // Prepare competitors data format for AI
            const competitorsForAi = topCompetitors.map(v => ({
                title: v.title || "",
                description: v.description || "",
                tags: v.tags || []
            }));

            setProgress(30);

            // 3. AI Analysis
            setStatusText("Extracting winning patterns...");
            const patterns = await extractPatterns(competitorsForAi, apiKey, selectedModel);
            setProgress(50);

            setStatusText("Identifying opportunities & gaps...");
            const gapAnalysisData = await analyzeGaps(
                patterns,
                userInput.title,
                userInput.description,
                userTagsArray,
                apiKey,
                selectedModel
            );
            setProgress(70);

            setStatusText("Optimizing your metadata...");

            // Parallelize optimization tasks
            const [titleRes, descRes, tagsRes] = await Promise.all([
                optimizeTitle(patterns, userInput.title, userInput.description, apiKey, selectedModel), // Passing userDesc as context
                optimizeDescription(patterns, userInput.description, userInput.title, userTagsArray, apiKey, selectedModel),
                suggestTags(
                    topCompetitors.map(v => v.tags || []),
                    userInput.title,
                    userInput.description,
                    userTagsArray,
                    apiKey,
                    selectedModel
                )
            ]);

            setProgress(90);

            // Construct Analysis Object
            // Extract gaps list (assuming gapAnalysis.gaps is array of objects)
            const gapsList = Array.isArray(gapAnalysisData.gaps)
                ? gapAnalysisData.gaps.map((g: any) => g.issue || JSON.stringify(g))
                : [];

            // Extract title variants
            const titleVariants = Array.isArray(titleRes.variants)
                ? titleRes.variants.map((v: any) => v.title)
                : [];

            // Extract optimized description
            const optDescription = descRes.optimizedDescription || "";

            // Extract suggested tags
            const suggestedTags = Array.isArray(tagsRes.suggestedTags) ? tagsRes.suggestedTags : [];

            const analysisData = {
                user_title: userInput.title,
                user_description: userInput.description,
                user_tags: userTagsArray,
                user_embedding: userEmbedding,
                top_video_ids: topCompetitors.map(v => v.id),
                pattern_analysis: patterns,
                scores: {
                    homepage: gapAnalysisData.scores?.homepage || 80,
                    suggested: gapAnalysisData.scores?.suggested || 80,
                    cpi: gapAnalysisData.scores?.cpi || 80,
                    gaps: gapsList
                },
                suggestions: {
                    titleVariants: titleVariants,
                    optimizedDescription: optDescription,
                    suggestedTags: suggestedTags
                },
                validation_score: 0
            };

            await saveAnalysis(project.id, analysisData as any);
            await updateProject(project.id, { status: "done" });

            setPhase("completed");
            setProgress(100);

        } catch (error) {
            console.error("Analysis failed:", error);
            const msg = error instanceof Error ? error.message : "Unknown error";
            setStatusText(`Analysis failed: ${msg}`);
        }
    };

    return (
        <GlassCard variant="elevated">
            <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    AI Analysis in Progress
                </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-6">
                {phase === "analyzing" && (
                    <div className="py-10 space-y-6 text-center">
                        <div className="relative w-24 h-24 mx-auto">
                            <Loader2 className="w-24 h-24 animate-spin text-primary opacity-20" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl font-bold">{Math.round(progress)}%</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-medium">{statusText}</h3>
                            <Progress value={progress} className="h-2 w-full max-w-md mx-auto" />
                        </div>
                    </div>
                )}

                {phase === "completed" && analysis && (
                    <div className="space-y-6">
                        <div className="grid md:grid-cols-3 gap-4">
                            <GlassCard className="p-4 bg-green-500/10 border-green-500/20">
                                <div className="flex items-center gap-2 mb-2 text-green-600">
                                    <Target className="h-4 w-4" />
                                    <span className="font-semibold">Similarity Score</span>
                                </div>
                                <div className="text-2xl font-bold">
                                    {analysis.top_video_ids?.length > 0 && videos.length > 0
                                        ? (() => {
                                            const topVideo = videos.find(v => v.id === analysis.top_video_ids[0]);
                                            if (!topVideo?.embedding || !analysis.user_embedding) return "N/A";
                                            const parseEmbedding = (emb: any): number[] | null => {
                                                if (!emb) return null;
                                                if (Array.isArray(emb)) return emb;
                                                if (typeof emb === 'string') {
                                                    try { return JSON.parse(emb); } catch { return null; }
                                                }
                                                return null;
                                            };
                                            const videoEmb = parseEmbedding(topVideo.embedding);
                                            const userEmb = parseEmbedding(analysis.user_embedding);
                                            if (!videoEmb || !userEmb) return "N/A";
                                            try {
                                                const score = cosineSimilarity(userEmb, videoEmb);
                                                return (score * 100).toFixed(1) + "%";
                                            } catch { return "N/A"; }
                                        })()
                                        : "N/A"}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Match with top competitor</p>
                            </GlassCard>
                            <GlassCard className="p-4 bg-blue-500/10 border-blue-500/20">
                                <div className="flex items-center gap-2 mb-2 text-blue-600">
                                    <TrendingUp className="h-4 w-4" />
                                    <span className="font-semibold">Top Competitors</span>
                                </div>
                                <div className="text-2xl font-bold">{analysis.top_video_ids?.length || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">Similar videos analyzed</p>
                            </GlassCard>
                            <GlassCard className="p-4 bg-amber-500/10 border-amber-500/20">
                                <div className="flex items-center gap-2 mb-2 text-amber-600">
                                    <Lightbulb className="h-4 w-4" />
                                    <span className="font-semibold">Gaps Found</span>
                                </div>
                                <div className="text-2xl font-bold">{analysis.scores?.gaps?.length || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">Opportunities to stand out</p>
                            </GlassCard>
                        </div>

                        {/* Top Competitor Videos */}
                        <div className="mt-6 space-y-3">
                            <h4 className="text-sm font-medium">Your Input Will Compete With These Videos</h4>
                            <div className="grid gap-3">
                                {(videos || [])
                                    .filter(v => (analysis.top_video_ids || []).includes(v.id))
                                    .slice(0, 10)
                                    .map((video, idx) => (
                                        <div
                                            key={idx}
                                            className="flex gap-3 p-2 rounded border bg-card/50 hover:bg-card transition-colors cursor-pointer"
                                            onClick={() => window.open(`https://youtube.com/watch?v=${video.youtube_id}`, '_blank')}
                                        >
                                            <img src={video.thumbnail_url || ""} alt="" className="w-20 h-12 object-cover rounded" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium line-clamp-1">{video.title}</div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                    <span>{video.channel_title}</span>
                                                    <span>•</span>
                                                    <span>{formatNumber(video.view_count)} views</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}

                {phase === "idle" && !analysis && (
                    <div className="flex flex-col items-center gap-6 py-10">
                        <div className="w-full max-w-sm space-y-4">
                            <ModelSelector
                                label="Analysis Model"
                                value={selectedModel}
                                onChange={setSelectedModel}
                            />
                            <p className="text-xs text-center text-muted-foreground">
                                Select the AI model to perform pattern extraction and optimization.
                            </p>
                        </div>
                        <Button onClick={handleStartAnalysis} size="lg" className="w-full max-w-sm">
                            Start Analysis
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
                        See Results
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </GlassCardContent>
        </GlassCard>
    );
}
