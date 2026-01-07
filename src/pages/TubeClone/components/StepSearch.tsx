import { useState, useEffect, useRef } from "react";
import { Search, Loader2, ArrowRight, ArrowLeft, CheckCircle, AlertCircle, ExternalLink, Tag } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useToast } from "@/hooks/use-toast";
import { multiQuerySearch, getVideoDetails, getPublishedAfterDate } from "@/lib/youtube-search";
import { scoreAndFilterVideos, formatNumber, type ScoredVideo } from "@/lib/video-filter";
import { useTubeCloneContext } from "../context";
import type { TubeCloneProject } from "../types";

interface StepSearchProps {
    project: TubeCloneProject;
    onNext: () => void;
    onBack: () => void;
    autoStart?: boolean; // Auto-start search when entering step
}

type SearchPhase = "idle" | "searching" | "fetching_details" | "filtering" | "saving" | "done" | "error";

export function StepSearch({ project, onNext, onBack, autoStart = false }: StepSearchProps) {
    const { settings, loading: settingsLoading } = useUserSettings();
    const { toast } = useToast();
    // Use shared context
    const { updateProject, saveVideos, videos: savedVideos } = useTubeCloneContext();

    const [phase, setPhase] = useState<SearchPhase>("idle");
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("");
    const [searchResults, setSearchResults] = useState<ScoredVideo[]>([]);
    const [error, setError] = useState<string | null>(null);
    const hasAutoStarted = useRef(false);

    // Video detail modal
    const [selectedVideo, setSelectedVideo] = useState<ScoredVideo | null>(null);

    // Convert saved videos to ScoredVideo format
    const convertSavedVideos = (): ScoredVideo[] => {
        return savedVideos.map(v => ({
            videoId: v.youtube_id,
            title: v.title || "",
            description: v.description || "",
            tags: v.tags || [],
            categoryId: v.category_id || "",
            channelId: v.channel_id || "",
            channelTitle: v.channel_title || "",
            thumbnailUrl: v.thumbnail_url || "",
            viewCount: v.view_count,
            likeCount: v.like_count,
            commentCount: v.comment_count,
            duration: v.duration || "",
            publishedAt: v.published_at || "",
            engagementRate: v.engagement_rate || 0,
            viewVelocity: v.view_velocity || 0,
            combinedScore: v.combined_score || 0,
            daysSincePublish: 0,
        }));
    };

    // Check if we already have results from database OR auto-start
    useEffect(() => {
        if (savedVideos.length > 0) {
            setSearchResults(convertSavedVideos());
            setPhase("done");
            setStatusText(`Loaded ${savedVideos.length} videos`);
        } else if (autoStart && !hasAutoStarted.current && !settingsLoading) {
            // Only auto-start if not loading settings
            hasAutoStarted.current = true;
            handleStartSearch();
        }
    }, [savedVideos, autoStart, settingsLoading]);

    const handleStartSearch = async () => {
        // Wait for settings to ensure we have key
        if (settingsLoading) {
            // Shouldn't happen if triggered by autoStart effect check, 
            // but manual click might race
            return;
        }

        const apiKey = settings?.youtube_api_key;
        if (!apiKey) {
            toast({
                title: "Error",
                description: "YouTube API Key is not configured. Please add it in Settings.",
                variant: "destructive",
            });
            setPhase("error");
            setError("YouTube API Key is not configured. Please add it in Settings.");
            return;
        }

        setPhase("searching");
        setProgress(0);
        setError(null);
        setSearchResults([]);

        try {
            // Get category and tags from source URL if provided
            let categoryId: string | undefined;
            let sourceTags: string[] = [];

            if (project.source_url) {
                setStatusText("Analyzing source video...");
                try {
                    const sourceDetails = await getVideoDetails(
                        [project.source_url.match(/[?&]v=([^&]+)/)?.[1] || ''],
                        apiKey
                    );

                    if (sourceDetails.length > 0) {
                        categoryId = sourceDetails[0].categoryId;
                        sourceTags = sourceDetails[0].tags || [];
                    }
                } catch (e) {
                    console.warn("Failed to analyze source video", e);
                }
            }

            // Parse time range to get publishedAfter date
            let publishedAfter: string | undefined;
            const timeRange = project.time_range;
            if (timeRange) {
                const now = new Date();
                if (timeRange.endsWith('h')) {
                    const hours = parseInt(timeRange);
                    now.setHours(now.getHours() - hours);
                    publishedAfter = now.toISOString();
                } else if (timeRange.endsWith('d')) {
                    const days = parseInt(timeRange);
                    now.setDate(now.getDate() - days);
                    publishedAfter = now.toISOString();
                } else {
                    publishedAfter = getPublishedAfterDate(timeRange);
                }
            }

            // Optimized relevance-only search with multi-query strategy
            setStatusText("Searching YouTube with optimized relevance strategy...");
            setProgress(10);

            const searchResultsRaw = await multiQuerySearch(
                project.niche || "trending",
                sourceTags,
                apiKey,
                {
                    resultsPerQuery: Math.ceil(project.video_limit * 0.8),
                    regionCode: project.country,
                    publishedAfter,
                    videoCategoryId: categoryId,
                    onProgress: (query: string, current: number, total: number) => {
                        setProgress(10 + (current / total) * 30);
                        setStatusText(`Searching: "${query.substring(0, 30)}..." (${current}/${total})`);
                    },
                }
            );

            if (searchResultsRaw.length === 0) {
                throw new Error("No videos found. Try different search terms or settings.");
            }

            setStatusText(`Found ${searchResultsRaw.length} videos, fetching details...`);
            setProgress(45);

            // Fetch video details
            setPhase("fetching_details");
            const videoIds = searchResultsRaw.map((v: any) => v.videoId);
            const videoDetails = await getVideoDetails(videoIds, apiKey);
            setProgress(65);

            setStatusText(`Analyzing ${videoDetails.length} videos with tag matching...`);

            // Score and filter with enhanced tag + category matching
            setPhase("filtering");
            const scoredVideos = scoreAndFilterVideos(videoDetails, project.video_limit, {
                removeOutliers: false,
                sourceTags,
                sourceCategoryId: categoryId,
                // New weights: 40% engagement, 30% velocity, 20% tags, 10% category
                engagementWeight: 0.4,
                velocityWeight: 0.3,
                tagWeight: 0.2,
                categoryWeight: 0.1,
            });
            setProgress(85);

            setStatusText(`Saving top ${scoredVideos.length} videos...`);

            // Save to database
            setPhase("saving");
            const videosToSave = scoredVideos.map(v => ({
                youtube_id: v.videoId,
                title: v.title,
                description: v.description,
                tags: v.tags,
                category_id: v.categoryId,
                channel_id: v.channelId,
                channel_title: v.channelTitle,
                thumbnail_url: v.thumbnailUrl,
                view_count: v.viewCount,
                like_count: v.likeCount,
                comment_count: v.commentCount,
                duration: v.duration,
                published_at: v.publishedAt,
                engagement_rate: v.engagementRate,
                view_velocity: v.viewVelocity,
                combined_score: v.combinedScore,
            }));

            await saveVideos(project.id, videosToSave);
            await updateProject(project.id, { status: "filtering" });

            setSearchResults(scoredVideos);
            setProgress(100);
            setPhase("done");
            setStatusText(`Found ${scoredVideos.length} top videos!`);

            toast({
                title: "Search Complete",
                description: `Found and analyzed ${scoredVideos.length} videos`,
            });

        } catch (err) {
            console.error("Search error:", err);
            const message = err instanceof Error ? err.message : "Search failed";
            setError(message);
            setPhase("error");
            toast({
                title: "Error",
                description: message,
                variant: "destructive",
            });
        }
    };

    return (
        <>
            <GlassCard variant="elevated">
                <GlassCardHeader>
                    <GlassCardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Search & Analyze Videos
                    </GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent className="space-y-6">
                    {/* Search Configuration Summary */}
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">🌍 {project.country}</Badge>
                        <Badge variant="outline">📅 {project.time_range}</Badge>
                        <Badge variant="outline">🎬 {project.video_limit} videos</Badge>
                        {project.niche && <Badge variant="outline">🎯 {project.niche}</Badge>}
                    </div>

                    {/* Progress */}
                    {phase !== "idle" && phase !== "done" && phase !== "error" && (
                        <div className="space-y-3">
                            <Progress value={progress} className="h-2" />
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {statusText}
                            </div>
                        </div>
                    )}

                    {/* Success State - Show all videos */}
                    {phase === "done" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle className="h-5 w-5" />
                                    <span className="font-medium">{statusText}</span>
                                </div>
                                <Badge variant="outline">{searchResults.length} videos</Badge>
                            </div>

                            {/* Video list with scroll */}
                            <ScrollArea className="h-[400px] rounded-lg border">
                                <div className="space-y-2 p-2">
                                    {searchResults.map((video, idx) => (
                                        <div
                                            key={video.videoId}
                                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                                            onClick={() => setSelectedVideo(video)}
                                        >
                                            <span className="text-xs font-bold text-muted-foreground w-6 text-center">
                                                #{idx + 1}
                                            </span>
                                            <img
                                                src={video.thumbnailUrl}
                                                alt=""
                                                className="w-20 h-12 object-cover rounded"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium line-clamp-1">{video.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {video.channelTitle} • {formatNumber(video.viewCount)} views
                                                </p>
                                                <div className="flex gap-1 mt-1">
                                                    {video.tags.slice(0, 3).map((tag, i) => (
                                                        <Badge key={i} variant="secondary" className="text-[10px] px-1 py-0">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                    {video.tags.length > 3 && (
                                                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                                                            +{video.tags.length - 3}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge className="bg-primary/20 text-primary">
                                                    {video.combinedScore.toFixed(0)}
                                                </Badge>
                                                <p className="text-[10px] text-muted-foreground mt-1">
                                                    {video.engagementRate.toFixed(2)}% eng
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(`https://youtube.com/watch?v=${video.videoId}`, '_blank');
                                                }}
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    {/* Error State */}
                    {phase === "error" && (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <AlertCircle className="h-12 w-12 text-destructive" />
                            <p className="text-destructive text-center">{error}</p>
                            <Button onClick={handleStartSearch}>Retry Search</Button>
                        </div>
                    )}

                    {/* Idle State */}
                    {phase === "idle" && (
                        <div className="text-center py-8">
                            {settingsLoading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">Checking settings...</p>
                                </div>
                            ) : (
                                <>
                                    <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                    <p className="text-muted-foreground mb-4">
                                        Ready to search for top-performing videos in your niche
                                    </p>
                                    <Button onClick={handleStartSearch} size="lg" className="gap-2">
                                        <Search className="h-4 w-4" />
                                        Start Search
                                    </Button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between pt-4 border-t">
                        <Button variant="outline" onClick={onBack} className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <div className="flex gap-2">
                            {phase === "done" && (
                                <Button variant="outline" onClick={handleStartSearch}>
                                    Re-Search
                                </Button>
                            )}
                            <Button
                                onClick={onNext}
                                disabled={phase !== "done"}
                                className="gap-2"
                            >
                                Continue
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </GlassCardContent>
            </GlassCard>

            {/* Video Detail Modal */}
            <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    {selectedVideo && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="line-clamp-2">{selectedVideo.title}</DialogTitle>
                                <DialogDescription>
                                    {selectedVideo.channelTitle} • {formatNumber(selectedVideo.viewCount)} views
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                <img
                                    src={selectedVideo.thumbnailUrl}
                                    alt=""
                                    className="w-full aspect-video object-cover rounded-lg"
                                />

                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="p-3 rounded-lg bg-muted/50">
                                        <div className="text-xl font-bold">{formatNumber(selectedVideo.viewCount)}</div>
                                        <div className="text-xs text-muted-foreground">Views</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted/50">
                                        <div className="text-xl font-bold">{formatNumber(selectedVideo.likeCount)}</div>
                                        <div className="text-xs text-muted-foreground">Likes</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted/50">
                                        <div className="text-xl font-bold">{selectedVideo.engagementRate.toFixed(2)}%</div>
                                        <div className="text-xs text-muted-foreground">Engagement</div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-medium flex items-center gap-2">
                                        <Tag className="h-4 w-4" />
                                        Tags ({selectedVideo.tags.length})
                                    </h4>
                                    <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto">
                                        {selectedVideo.tags.map((tag, idx) => (
                                            <Badge key={idx} variant="secondary">{tag}</Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-medium">Description</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap max-h-40 overflow-y-auto">
                                        {selectedVideo.description}
                                    </p>
                                </div>

                                <Button
                                    className="w-full gap-2"
                                    onClick={() => window.open(`https://youtube.com/watch?v=${selectedVideo.videoId}`, '_blank')}
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Open on YouTube
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
