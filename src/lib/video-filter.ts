// Video filtering and scoring logic

import type { YouTubeVideoDetails } from "./youtube-search";

export interface ScoredVideo extends YouTubeVideoDetails {
    engagementRate: number;
    viewVelocity: number;
    combinedScore: number;
    daysSincePublish: number;
    tagOverlapScore?: number;
    categoryMatch?: boolean;
}

// Calculate engagement rate
function calculateEngagement(likes: number, comments: number, views: number): number {
    if (views === 0) return 0;
    return ((likes + comments) / views) * 100;
}

// Calculate view velocity (views per day)
function calculateViewVelocity(views: number, publishedAt: string): number {
    const publishDate = new Date(publishedAt);
    const now = new Date();
    const daysSince = Math.max(1, Math.floor((now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24)));
    return views / daysSince;
}

// Calculate days since publish
function daysSincePublish(publishedAt: string): number {
    const publishDate = new Date(publishedAt);
    const now = new Date();
    return Math.max(1, Math.floor((now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24)));
}

// Normalize a value to 0-100 range
function normalize(value: number, min: number, max: number): number {
    if (max === min) return 50;
    return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

// Calculate tag overlap score (Jaccard similarity)
function calculateTagOverlap(sourceTags: string[], videoTags: string[]): number {
    if (!sourceTags || sourceTags.length === 0 || !videoTags || videoTags.length === 0) {
        return 0;
    }

    // Normalize tags (lowercase)
    const sourceSet = new Set(sourceTags.map(t => t.toLowerCase().trim()));
    const videoSet = new Set(videoTags.map(t => t.toLowerCase().trim()));

    // Calculate intersection
    let intersection = 0;
    for (const tag of sourceSet) {
        if (videoSet.has(tag)) {
            intersection++;
        }
    }

    // Jaccard similarity = intersection / union
    const union = sourceSet.size + videoSet.size - intersection;
    return union > 0 ? (intersection / union) * 100 : 0;
}

// Calculate IQR and filter outliers
function filterOutliers(values: number[], multiplier: number = 1.5): { min: number; max: number } {
    if (values.length < 4) return { min: Math.min(...values), max: Math.max(...values) };

    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;

    return {
        min: q1 - iqr * multiplier,
        max: q3 + iqr * multiplier,
    };
}

// Score and filter videos with enhanced tag and category matching
export function scoreAndFilterVideos(
    videos: YouTubeVideoDetails[],
    topN: number = 50,
    options: {
        engagementWeight?: number;
        velocityWeight?: number;
        tagWeight?: number;
        categoryWeight?: number;
        removeOutliers?: boolean;
        sourceTags?: string[];
        sourceCategoryId?: string;
    } = {}
): ScoredVideo[] {
    const {
        engagementWeight = 0.4,
        velocityWeight = 0.3,
        tagWeight = 0.2,
        categoryWeight = 0.1,
        removeOutliers = true,
        sourceTags = [],
        sourceCategoryId
    } = options;

    if (videos.length === 0) return [];

    // Step 1: Calculate metrics for each video
    let scoredVideos: ScoredVideo[] = videos.map(video => {
        const engagementRate = calculateEngagement(video.likeCount, video.commentCount, video.viewCount);
        const viewVelocity = calculateViewVelocity(video.viewCount, video.publishedAt);
        const days = daysSincePublish(video.publishedAt);

        // Calculate tag overlap if source tags provided
        const tagOverlapScore = sourceTags.length > 0
            ? calculateTagOverlap(sourceTags, video.tags)
            : 50; // Default neutral score if no tags

        // Check category match
        const categoryMatch = sourceCategoryId
            ? video.categoryId === sourceCategoryId
            : true; // Default true if no category filter

        return {
            ...video,
            engagementRate,
            viewVelocity,
            tagOverlapScore,
            categoryMatch,
            combinedScore: 0, // Will calculate after normalization
            daysSincePublish: days,
        };
    });

    // Step 2: Remove outliers (optional)
    if (removeOutliers && scoredVideos.length > 10) {
        const viewCounts = scoredVideos.map(v => v.viewCount);
        const bounds = filterOutliers(viewCounts);

        scoredVideos = scoredVideos.filter(
            v => v.viewCount >= bounds.min && v.viewCount <= bounds.max
        );
    }

    if (scoredVideos.length === 0) return [];

    // Step 3: Normalize and calculate combined score
    const engagements = scoredVideos.map(v => v.engagementRate);
    const velocities = scoredVideos.map(v => v.viewVelocity);
    const tagScores = scoredVideos.map(v => v.tagOverlapScore || 0);

    const engMin = Math.min(...engagements);
    const engMax = Math.max(...engagements);
    const velMin = Math.min(...velocities);
    const velMax = Math.max(...velocities);
    const tagMin = Math.min(...tagScores);
    const tagMax = Math.max(...tagScores);

    scoredVideos = scoredVideos.map(video => {
        const normalizedEngagement = normalize(video.engagementRate, engMin, engMax);
        const normalizedVelocity = normalize(video.viewVelocity, velMin, velMax);
        const normalizedTagScore = normalize(video.tagOverlapScore || 0, tagMin, tagMax);
        const categoryBonus = video.categoryMatch ? categoryWeight * 100 : 0;

        // Combined score with new weights
        const combinedScore =
            normalizedEngagement * engagementWeight +
            normalizedVelocity * velocityWeight +
            normalizedTagScore * tagWeight +
            categoryBonus;

        return {
            ...video,
            combinedScore,
        };
    });

    // Step 4: Sort by combined score and return top N
    return scoredVideos
        .sort((a, b) => b.combinedScore - a.combinedScore)
        .slice(0, topN);
}

// Format number with K/M suffix
export function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
}
