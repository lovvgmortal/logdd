import { useState, useEffect } from "react";
import { Globe, Clock, Video, Link as LinkIcon, ArrowRight, Loader2, Search, Type } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useTubeCloneContext } from "../context";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useToast } from "@/hooks/use-toast";
import { extractVideoId, getVideoDetails } from "@/lib/youtube-search";
import type { TubeCloneProject } from "../types";

// Video preview interface
interface VideoPreview {
    title: string;
    description: string;
    tags: string[];
    categoryId: string;
    publishedAt: string;
    channelTitle: string;
    thumbnailUrl: string;
}

interface ConfigState {
    name: string;
    sourceUrl: string;
    country: string;
    hoursRange: number;
    videoLimit: number;
    videoPreview: VideoPreview | null;
    detectedNiche: string;
}

interface StepConfigProps {
    project: TubeCloneProject;
    configState: ConfigState;
    setConfigState: React.Dispatch<React.SetStateAction<ConfigState>>;
    onNext: () => void;
}

// Countries with ISO codes (must match YouTube API region codes)
const COUNTRIES = [
    { value: "US", label: "🇺🇸 United States" },
    { value: "GB", label: "🇬🇧 United Kingdom" },
    { value: "VN", label: "🇻🇳 Vietnam" },
    { value: "JP", label: "🇯🇵 Japan" },
    { value: "KR", label: "🇰🇷 Korea" },
    { value: "IN", label: "🇮🇳 India" },
    { value: "DE", label: "🇩🇪 Germany" },
    { value: "FR", label: "🇫🇷 France" },
    { value: "BR", label: "🇧🇷 Brazil" },
    { value: "ID", label: "🇮🇩 Indonesia" },
    { value: "TH", label: "🇹🇭 Thailand" },
    { value: "PH", label: "🇵🇭 Philippines" },
    { value: "AU", label: "🇦🇺 Australia" },
    { value: "CA", label: "🇨🇦 Canada" },
    { value: "MX", label: "🇲🇽 Mexico" },
    { value: "ES", label: "🇪🇸 Spain" },
    { value: "IT", label: "🇮🇹 Italy" },
    { value: "RU", label: "🇷🇺 Russia" },
    { value: "PL", label: "🇵🇱 Poland" },
    { value: "NL", label: "🇳🇱 Netherlands" },
];

// Slider logic
const TIME_MARKERS = [
    { slider: 0, hours: 1, label: "1h" },
    { slider: 23, hours: 24, label: "24h" },
    { slider: 30, hours: 24 * 7, label: "7d" },
    { slider: 60, hours: 24 * 30, label: "30d" },
    { slider: 120, hours: 24 * 90, label: "90d" },
    { slider: 180, hours: 24 * 180, label: "180d" },
    { slider: 240, hours: 24 * 365, label: "1y" },
];

function sliderToHours(slider: number): number {
    if (slider <= 23) return slider + 1;
    if (slider <= 30) return (2 + (slider - 24)) * 24;
    if (slider <= 60) return (8 + Math.round((slider - 31) * (22 / 29))) * 24;
    if (slider <= 120) return (31 + Math.round((slider - 61) * (59 / 59))) * 24;
    if (slider <= 180) return (91 + Math.round((slider - 121) * (89 / 59))) * 24;
    const day = 181 + Math.round((slider - 181) * (184 / 59));
    return Math.min(day, 365) * 24;
}

function hoursToSlider(hours: number): number {
    const days = hours / 24;
    if (hours <= 24) return hours - 1;
    if (days <= 7) return 24 + (days - 2);
    if (days <= 30) return 31 + Math.round((days - 8) * (29 / 22));
    if (days <= 90) return 61 + Math.round((days - 31) * (59 / 59));
    if (days <= 180) return 121 + Math.round((days - 91) * (59 / 89));
    return 181 + Math.round((days - 181) * (59 / 184));
}

function formatHoursLabel(hours: number): string {
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''}`;
    const days = Math.round(hours / 24);
    if (days === 1) return "1 day";
    if (days < 7) return `${days} days`;
    if (days === 7) return "1 week";
    if (days < 14) return `${days} days`;
    if (days < 30) return `${Math.round(days / 7)} weeks`;
    if (days === 30) return "1 month";
    if (days < 60) return `${days} days`;
    if (days < 90) return `${Math.round(days / 30)} months`;
    if (days === 90) return "3 months";
    if (days < 180) return `${Math.round(days / 30)} months`;
    if (days === 180) return "6 months";
    if (days < 365) return `${Math.round(days / 30)} months`;
    return "1 year";
}

export function StepConfig({ project, configState, setConfigState, onNext }: StepConfigProps) {
    const { updateProject, videos } = useTubeCloneContext();
    const { settings } = useUserSettings();
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);
    const [fetching, setFetching] = useState(false);

    const sliderValue = hoursToSlider(configState.hoursRange);

    const handleFetchVideoDetails = async () => {
        if (!configState.sourceUrl) {
            toast({ title: "Error", description: "Please enter a YouTube URL first", variant: "destructive" });
            return;
        }

        const apiKey = settings?.youtube_api_key;
        if (!apiKey) {
            toast({ title: "Error", description: "YouTube API Key is not configured. Please add it in Settings.", variant: "destructive" });
            return;
        }

        const videoId = extractVideoId(configState.sourceUrl);
        if (!videoId) {
            toast({ title: "Error", description: "Invalid YouTube URL", variant: "destructive" });
            return;
        }

        setFetching(true);
        try {
            const details = await getVideoDetails([videoId], apiKey);
            if (details.length > 0) {
                const video = details[0];
                setConfigState(prev => ({
                    ...prev,
                    videoPreview: {
                        title: video.title,
                        description: video.description,
                        tags: video.tags,
                        categoryId: video.categoryId,
                        publishedAt: video.publishedAt,
                        channelTitle: video.channelTitle,
                        thumbnailUrl: video.thumbnailUrl,
                    },
                    // Auto-fill Title as Niche search keyword if not set
                    detectedNiche: prev.detectedNiche || video.title,
                }));

                toast({ title: "Video Found", description: `"${video.title}"` });
            }
        } catch (error) {
            console.error("Error fetching video:", error);
            toast({ title: "Error", description: "Failed to fetch video details", variant: "destructive" });
        } finally {
            setFetching(false);
        }
    };

    const handleSaveAndNext = async () => {
        setSaving(true);

        // Convert hours to time range string for storage
        const hours = configState.hoursRange;
        const days = Math.round(hours / 24);
        let timeRange: string;

        if (hours < 24) {
            timeRange = `${hours}h`;
        } else {
            timeRange = `${days}d`;
        }

        // Use user-defined Niche/Keywords
        const nicheToSave = configState.detectedNiche || configState.name;

        await updateProject(project.id, {
            name: configState.name,
            source_url: configState.sourceUrl || null,
            country: configState.country,
            time_range: timeRange,
            video_limit: configState.videoLimit,
            niche: nicheToSave,
            category_id: configState.videoPreview?.categoryId || null,
            status: "searching", // Set status to searching to trigger search step logic
        });
        setSaving(false);
        onNext();
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric"
        });
    };

    const getCategoryName = (categoryId: string) => {
        const categories: Record<string, string> = {
            "1": "Film & Animation", "2": "Autos & Vehicles", "10": "Music", "15": "Pets & Animals",
            "17": "Sports", "18": "Short Movies", "19": "Travel & Events", "20": "Gaming",
            "21": "Videoblogging", "22": "People & Blogs", "23": "Comedy", "24": "Entertainment",
            "25": "News & Politics", "26": "Howto & Style", "27": "Education", "28": "Science & Technology",
            "29": "Nonprofits & Activism",
        };
        return categories[categoryId] || `Category ${categoryId}`;
    };

    return (
        <GlassCard variant="elevated">
            <GlassCardHeader>
                <GlassCardTitle>Research Configuration</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Project Name</Label>
                    <Input
                        value={configState.name}
                        onChange={(e) => setConfigState(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="My YouTube Research"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" />
                        Competitor Video URL (Optional)
                    </Label>
                    <div className="flex gap-2">
                        <Input
                            value={configState.sourceUrl}
                            onChange={(e) => setConfigState(prev => ({ ...prev, sourceUrl: e.target.value, videoPreview: null }))}
                            placeholder="https://youtube.com/watch?v=..."
                            className="flex-1"
                        />
                        <Button variant="outline" onClick={handleFetchVideoDetails} disabled={fetching || !configState.sourceUrl} className="gap-2">
                            {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            Fetch
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Paste a URL to auto-fill search keywords, detecting category and tags.</p>
                </div>

                {/* Search Keywords Input - NEW */}
                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <Type className="h-4 w-4" />
                        Search Keywords / Niche
                    </Label>
                    <Input
                        value={configState.detectedNiche}
                        onChange={(e) => setConfigState(prev => ({ ...prev, detectedNiche: e.target.value }))}
                        placeholder="e.g. 'coding tutorials', 'vegan recipes', 'minecraft gameplay'"
                    />
                    <p className="text-xs text-muted-foreground">These keywords will be used to find competitor videos.</p>
                </div>

                {configState.videoPreview && (
                    <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
                        <div className="flex gap-3">
                            <img src={configState.videoPreview.thumbnailUrl} alt="" className="w-32 h-20 object-cover rounded" />
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium line-clamp-2">{configState.videoPreview.title}</h4>
                                <p className="text-xs text-muted-foreground">{configState.videoPreview.channelTitle}</p>
                                {/* Description added */}
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{configState.videoPreview.description}</p>
                            </div>
                        </div>

                        <div className="grid gap-2 text-sm">
                            <div className="flex items-start gap-2">
                                <Badge variant="outline" className="shrink-0">Category</Badge>
                                <span className="text-muted-foreground">{getCategoryName(configState.videoPreview.categoryId)}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <Badge variant="outline" className="shrink-0">Published</Badge>
                                <span className="text-muted-foreground">{formatDate(configState.videoPreview.publishedAt)}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <Badge variant="outline" className="shrink-0">Tags ({configState.videoPreview.tags.length})</Badge>
                                {configState.videoPreview.tags.length > 0 ? (
                                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                                        {configState.videoPreview.tags.map((tag, idx) => (
                                            <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground italic">No tags found</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Globe className="h-4 w-4" /> Target Country</Label>
                        <Select value={configState.country} onValueChange={(v) => setConfigState(prev => ({ ...prev, country: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {COUNTRIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center justify-between">
                            <span className="flex items-center gap-2"><Video className="h-4 w-4" /> Videos to Analyze</span>
                            <span className="text-primary font-bold">{configState.videoLimit}</span>
                        </Label>
                        <Slider
                            value={[configState.videoLimit]}
                            onValueChange={(v) => setConfigState(prev => ({ ...prev, videoLimit: v[0] }))}
                            min={50} max={200} step={10} className="py-2"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <Label className="flex items-center justify-between">
                        <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> Time Range (Past)</span>
                        <span className="text-primary font-bold">{formatHoursLabel(configState.hoursRange)}</span>
                    </Label>
                    <Slider
                        value={[sliderValue]}
                        onValueChange={(v) => {
                            const newHours = sliderToHours(v[0]);
                            setConfigState(prev => ({ ...prev, hoursRange: newHours }));
                        }}
                        min={0} max={240} step={1} className="py-2"
                    />
                </div>

                <div className="flex justify-between pt-4">
                    {videos.length > 0 && (
                        <div className="text-sm text-yellow-600 flex items-center">
                            Warning: Changing keywords might require re-searching.
                        </div>
                    )}
                    <Button onClick={handleSaveAndNext} disabled={saving || !configState.name.trim()} className="gap-2 ml-auto">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Start Research <ArrowRight className="h-4 w-4" /></>}
                    </Button>
                </div>
            </GlassCardContent>
        </GlassCard>
    );
}
