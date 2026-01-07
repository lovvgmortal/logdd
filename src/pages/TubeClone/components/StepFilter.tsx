import { useState } from "react";
import { Filter, ArrowRight, ArrowLeft, Eye, TrendingUp, ThumbsUp, ExternalLink, Tag } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useTubeCloneContext } from "../context";
import { formatNumber } from "@/lib/video-filter";
import type { TubeCloneProject, TubeCloneVideo } from "../types";

interface StepFilterProps {
    project: TubeCloneProject;
    onNext: () => void;
    onBack: () => void;
}

export function StepFilter({ project, onNext, onBack }: StepFilterProps) {
    // Use shared context instead of new hook instance
    const { videos, updateProject } = useTubeCloneContext();

    const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
    const [sortBy, setSortBy] = useState<"score" | "views" | "engagement">("score");
    const [selectedVideo, setSelectedVideo] = useState<TubeCloneVideo | null>(null);

    const toggleExclude = (videoId: string) => {
        setExcludedIds(prev => {
            const next = new Set(prev);
            if (next.has(videoId)) {
                next.delete(videoId);
            } else {
                next.add(videoId);
            }
            return next;
        });
    };

    const sortedVideos = [...videos].sort((a, b) => {
        switch (sortBy) {
            case "views":
                return b.view_count - a.view_count;
            case "engagement":
                return (b.engagement_rate || 0) - (a.engagement_rate || 0);
            default:
                return (b.combined_score || 0) - (a.combined_score || 0);
        }
    });

    const activeVideos = sortedVideos.filter(v => !excludedIds.has(v.id));

    const handleContinue = async () => {
        await updateProject(project.id, { status: "embedding" });
        onNext();
    };

    return (
        <>
            <GlassCard variant="elevated">
                <GlassCardHeader>
                    <div className="flex items-center justify-between">
                        <GlassCardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Review Top Videos ({videos.length})
                        </GlassCardTitle>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Sort by:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="text-sm bg-background border rounded-md px-2 py-1"
                            >
                                <option value="score">Combined Score</option>
                                <option value="views">View Count</option>
                                <option value="engagement">Engagement</option>
                            </select>
                        </div>
                    </div>
                </GlassCardHeader>
                <GlassCardContent className="space-y-4">
                    {/* Stats Summary */}
                    <div className="flex gap-4 text-sm">
                        <Badge variant="outline" className="gap-1">
                            Total: {videos.length}
                        </Badge>
                        <Badge variant="outline" className="gap-1 text-green-600">
                            Active: {activeVideos.length}
                        </Badge>
                        {excludedIds.size > 0 && (
                            <Badge variant="outline" className="gap-1 text-red-600">
                                Excluded: {excludedIds.size}
                            </Badge>
                        )}
                    </div>

                    {/* Video List */}
                    <ScrollArea className="h-[400px] rounded-lg border">
                        <div className="space-y-2 p-2">
                            {sortedVideos.map((video, idx) => {
                                const isExcluded = excludedIds.has(video.id);

                                return (
                                    <div
                                        key={video.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${isExcluded
                                            ? "bg-muted/30 opacity-50 border-transparent"
                                            : "bg-card border-border hover:border-primary/30"
                                            }`}
                                        onClick={() => setSelectedVideo(video)}
                                    >
                                        <Checkbox
                                            checked={!isExcluded}
                                            onCheckedChange={() => toggleExclude(video.id)}
                                            onClick={(e) => e.stopPropagation()}
                                        />

                                        <span className="text-xs font-bold text-muted-foreground w-6">
                                            #{idx + 1}
                                        </span>

                                        <img
                                            src={video.thumbnail_url || ""}
                                            alt=""
                                            className="w-20 h-12 object-cover rounded"
                                        />

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium line-clamp-1">{video.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {video.channel_title}
                                            </p>
                                            <div className="flex gap-1 mt-1">
                                                {(video.tags || []).slice(0, 3).map((tag, i) => (
                                                    <Badge key={i} variant="secondary" className="text-[10px] px-1 py-0">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                                {(video.tags?.length || 0) > 3 && (
                                                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                                                        +{(video.tags?.length || 0) - 3}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Eye className="h-3 w-3" />
                                                {formatNumber(video.view_count)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <ThumbsUp className="h-3 w-3" />
                                                {formatNumber(video.like_count)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <TrendingUp className="h-3 w-3" />
                                                {(video.engagement_rate || 0).toFixed(2)}%
                                            </span>
                                        </div>

                                        <Badge className="bg-primary/20 text-primary min-w-[70px] justify-center">
                                            {(video.combined_score || 0).toFixed(0)}
                                        </Badge>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(`https://youtube.com/watch?v=${video.youtube_id}`, '_blank');
                                            }}
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>

                    {/* Navigation */}
                    <div className="flex justify-between pt-4 border-t">
                        <Button variant="outline" onClick={onBack} className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <Button
                            onClick={handleContinue}
                            disabled={activeVideos.length < 1}
                            className="gap-2"
                        >
                            Continue with {activeVideos.length} videos
                            <ArrowRight className="h-4 w-4" />
                        </Button>
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
                                    {selectedVideo.channel_title} • {formatNumber(selectedVideo.view_count)} views
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                <img
                                    src={selectedVideo.thumbnail_url || ""}
                                    alt=""
                                    className="w-full aspect-video object-cover rounded-lg"
                                />

                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="p-3 rounded-lg bg-muted/50">
                                        <div className="text-xl font-bold">{formatNumber(selectedVideo.view_count)}</div>
                                        <div className="text-xs text-muted-foreground">Views</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted/50">
                                        <div className="text-xl font-bold">{formatNumber(selectedVideo.like_count)}</div>
                                        <div className="text-xs text-muted-foreground">Likes</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted/50">
                                        <div className="text-xl font-bold">{(selectedVideo.engagement_rate || 0).toFixed(2)}%</div>
                                        <div className="text-xs text-muted-foreground">Engagement</div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-medium flex items-center gap-2">
                                        <Tag className="h-4 w-4" />
                                        Tags ({(selectedVideo.tags || []).length})
                                    </h4>
                                    <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto">
                                        {(selectedVideo.tags || []).map((tag, idx) => (
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
                                    onClick={() => window.open(`https://youtube.com/watch?v=${selectedVideo.youtube_id}`, '_blank')}
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
