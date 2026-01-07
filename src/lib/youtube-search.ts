// YouTube Search and Video Details API helpers

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export interface YouTubeSearchResult {
    videoId: string;
    title: string;
    channelId: string;
    channelTitle: string;
    description: string;
    publishedAt: string;
    thumbnailUrl: string;
}

export interface YouTubeVideoDetails {
    videoId: string;
    title: string;
    description: string;
    tags: string[];
    categoryId: string;
    channelId: string;
    channelTitle: string;
    thumbnailUrl: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    duration: string;
    publishedAt: string;
}

export type SearchOrder = "relevance" | "viewCount" | "rating" | "date";

interface SearchParams {
    query: string;
    apiKey: string;
    order?: SearchOrder;
    maxResults?: number;
    regionCode?: string;
    publishedAfter?: string;
    videoCategoryId?: string;
}

// Parse ISO 8601 duration to readable format
function parseDuration(duration: string): string {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return duration;

    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Calculate published after date based on time range
export function getPublishedAfterDate(timeRange: string): string | undefined {
    const now = new Date();
    switch (timeRange) {
        case "7d":
            now.setDate(now.getDate() - 7);
            break;
        case "30d":
            now.setDate(now.getDate() - 30);
            break;
        case "90d":
            now.setDate(now.getDate() - 90);
            break;
        case "1y":
            now.setFullYear(now.getFullYear() - 1);
            break;
        case "all":
            return undefined;
        default:
            now.setDate(now.getDate() - 30);
    }
    return now.toISOString();
}

// Search YouTube videos
export async function searchYouTubeVideos(params: SearchParams): Promise<YouTubeSearchResult[]> {
    const { query, apiKey, order = "relevance", maxResults = 50, regionCode, publishedAfter, videoCategoryId } = params;

    const url = new URL(`${YOUTUBE_API_BASE}/search`);
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "video");
    url.searchParams.set("q", query);
    url.searchParams.set("order", order);
    url.searchParams.set("maxResults", Math.min(maxResults, 50).toString());
    url.searchParams.set("key", apiKey);

    if (regionCode) url.searchParams.set("regionCode", regionCode);
    if (publishedAfter) url.searchParams.set("publishedAfter", publishedAfter);
    if (videoCategoryId) url.searchParams.set("videoCategoryId", videoCategoryId);

    const response = await fetch(url.toString());
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "YouTube search failed");
    }

    const data = await response.json();

    return (data.items || []).map((item: any) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        channelId: item.snippet.channelId,
        channelTitle: item.snippet.channelTitle,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt,
        thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
    }));
}

// Get video details in batch (up to 50 per request)
export async function getVideoDetails(videoIds: string[], apiKey: string): Promise<YouTubeVideoDetails[]> {
    if (videoIds.length === 0) return [];

    // YouTube API allows max 50 IDs per request
    const batches: string[][] = [];
    for (let i = 0; i < videoIds.length; i += 50) {
        batches.push(videoIds.slice(i, i + 50));
    }

    const allDetails: YouTubeVideoDetails[] = [];

    for (const batch of batches) {
        const url = new URL(`${YOUTUBE_API_BASE}/videos`);
        url.searchParams.set("part", "snippet,statistics,contentDetails");
        url.searchParams.set("id", batch.join(","));
        url.searchParams.set("key", apiKey);

        const response = await fetch(url.toString());
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "Failed to get video details");
        }

        const data = await response.json();

        const details = (data.items || []).map((item: any) => ({
            videoId: item.id,
            title: item.snippet.title,
            description: item.snippet.description,
            tags: item.snippet.tags || [],
            categoryId: item.snippet.categoryId,
            channelId: item.snippet.channelId,
            channelTitle: item.snippet.channelTitle,
            thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
            viewCount: parseInt(item.statistics.viewCount || "0"),
            likeCount: parseInt(item.statistics.likeCount || "0"),
            commentCount: parseInt(item.statistics.commentCount || "0"),
            duration: parseDuration(item.contentDetails.duration),
            publishedAt: item.snippet.publishedAt,
        }));

        allDetails.push(...details);
    }

    return allDetails;
}

// Get video category ID from a YouTube URL
export async function getVideoCategoryFromUrl(url: string, apiKey: string): Promise<string | null> {
    const videoId = extractVideoId(url);
    if (!videoId) return null;

    const details = await getVideoDetails([videoId], apiKey);
    return details[0]?.categoryId || null;
}

// Extract video ID from YouTube URL
export function extractVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    return null;
}

// Search with pagination support
async function searchWithPagination(
    params: SearchParams,
    totalResults: number,
    onProgress?: (current: number, total: number) => void
): Promise<YouTubeSearchResult[]> {
    const results: YouTubeSearchResult[] = [];
    let nextPageToken: string | undefined;
    const resultsPerPage = 50; // YouTube API max
    const pagesNeeded = Math.ceil(totalResults / resultsPerPage);

    for (let page = 0; page < pagesNeeded && results.length < totalResults; page++) {
        onProgress?.(page + 1, pagesNeeded);

        const url = new URL(`${YOUTUBE_API_BASE}/search`);
        url.searchParams.set("part", "snippet");
        url.searchParams.set("type", "video");
        url.searchParams.set("q", params.query);
        url.searchParams.set("order", params.order || "relevance");
        url.searchParams.set("maxResults", "50");
        url.searchParams.set("key", params.apiKey);

        if (params.regionCode) url.searchParams.set("regionCode", params.regionCode);
        if (params.publishedAfter) url.searchParams.set("publishedAfter", params.publishedAfter);
        if (params.videoCategoryId) url.searchParams.set("videoCategoryId", params.videoCategoryId);
        if (nextPageToken) url.searchParams.set("pageToken", nextPageToken);

        const response = await fetch(url.toString());
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "YouTube search failed");
        }

        const data = await response.json();
        const pageResults = (data.items || []).map((item: any) => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            channelId: item.snippet.channelId,
            channelTitle: item.snippet.channelTitle,
            description: item.snippet.description,
            publishedAt: item.snippet.publishedAt,
            thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        }));

        results.push(...pageResults);
        nextPageToken = data.nextPageToken;

        // Stop if no more pages
        if (!nextPageToken) break;
    }

    return results.slice(0, totalResults);
}

// Optimized relevance-only search with pagination
export async function relevanceOnlySearch(
    query: string,
    apiKey: string,
    options: {
        maxResults?: number;
        regionCode?: string;
        publishedAfter?: string;
        videoCategoryId?: string;
        onProgress?: (current: number, total: number) => void;
    } = {}
): Promise<YouTubeSearchResult[]> {
    const { maxResults = 100, regionCode, publishedAfter, videoCategoryId, onProgress } = options;

    return await searchWithPagination(
        {
            query,
            apiKey,
            order: "relevance",
            regionCode,
            publishedAfter,
            videoCategoryId,
        },
        maxResults,
        onProgress
    );
}

// Extract important keywords from title
export function extractKeywords(title: string, maxKeywords: number = 3): string[] {
    // Remove common words
    const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
        'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'could', 'should', 'may', 'might', 'must', 'can', 'how', 'what',
        'when', 'where', 'who', 'which', 'this', 'that', 'these', 'those'
    ]);

    const words = title
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word));

    // Return first N keywords (usually the most important ones)
    return words.slice(0, maxKeywords);
}

// Multi-query search using title and tags (optimized for relevance)
export async function multiQuerySearch(
    baseTitle: string,
    tags: string[],
    apiKey: string,
    options: {
        resultsPerQuery?: number;
        regionCode?: string;
        publishedAfter?: string;
        videoCategoryId?: string;
        onProgress?: (query: string, current: number, total: number) => void;
    } = {}
): Promise<YouTubeSearchResult[]> {
    const { resultsPerQuery = 50, regionCode, publishedAfter, videoCategoryId, onProgress } = options;

    const allResults: YouTubeSearchResult[] = [];
    const seenIds = new Set<string>();

    // Query 1: Full title (PRIMARY - 70-80% of results)
    const titleResultsCount = Math.ceil(resultsPerQuery * 0.75);
    onProgress?.(baseTitle, 1, tags.length > 0 ? 2 : 1);

    try {
        const titleResults = await relevanceOnlySearch(baseTitle, apiKey, {
            maxResults: titleResultsCount,
            regionCode,
            publishedAfter,
            videoCategoryId,
        });

        // Add title results
        for (const result of titleResults) {
            if (!seenIds.has(result.videoId)) {
                seenIds.add(result.videoId);
                allResults.push(result);
            }
        }
    } catch (error) {
        console.error(`Title query "${baseTitle}" failed:`, error);
    }

    // Query 2: Top 5-7 tags (SECONDARY - 20-30% of results, only if tags exist)
    if (tags && tags.length > 0) {
        const topTags = tags.slice(0, 7);
        const tagQuery = topTags.join(' ');
        const tagResultsCount = Math.ceil(resultsPerQuery * 0.25);

        onProgress?.(tagQuery, 2, 2);

        try {
            const tagResults = await relevanceOnlySearch(tagQuery, apiKey, {
                maxResults: tagResultsCount,
                regionCode,
                publishedAfter,
                videoCategoryId,
            });

            // Add tag results (deduplicated)
            for (const result of tagResults) {
                if (!seenIds.has(result.videoId)) {
                    seenIds.add(result.videoId);
                    allResults.push(result);
                }
            }
        } catch (error) {
            console.error(`Tag query "${tagQuery}" failed:`, error);
        }
    }

    return allResults;
}

// Multi-strategy search (4 different orders) - DEPRECATED, kept for backward compatibility
export async function multiStrategySearch(
    query: string,
    apiKey: string,
    options: {
        maxResultsPerStrategy?: number;
        regionCode?: string;
        publishedAfter?: string;
        videoCategoryId?: string;
        onProgress?: (strategy: string, current: number, total: number) => void;
    } = {}
): Promise<YouTubeSearchResult[]> {
    const { maxResultsPerStrategy = 50, regionCode, publishedAfter, videoCategoryId, onProgress } = options;

    const strategies: SearchOrder[] = ["relevance", "viewCount", "rating", "date"];
    const allResults: YouTubeSearchResult[] = [];
    const seenIds = new Set<string>();

    for (let i = 0; i < strategies.length; i++) {
        const order = strategies[i];
        onProgress?.(order, i + 1, strategies.length);

        try {
            const results = await searchYouTubeVideos({
                query,
                apiKey,
                order,
                maxResults: maxResultsPerStrategy,
                regionCode,
                publishedAfter,
                videoCategoryId,
            });

            // Deduplicate
            for (const result of results) {
                if (!seenIds.has(result.videoId)) {
                    seenIds.add(result.videoId);
                    allResults.push(result);
                }
            }
        } catch (error) {
            console.error(`Search strategy ${order} failed:`, error);
            // Continue with other strategies
        }
    }

    return allResults;
}
