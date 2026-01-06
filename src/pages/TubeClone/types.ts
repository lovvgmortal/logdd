// TubeClone Types

export interface TubeCloneProject {
    id: string;
    user_id: string;
    name: string;
    source_url: string | null;
    niche: string | null;
    country: string;
    category_id: string | null;
    video_limit: number;
    time_range: string;
    status: 'draft' | 'searching' | 'filtering' | 'embedding' | 'analyzing' | 'done';
    created_at: string;
    updated_at: string;
}

export interface TubeCloneVideo {
    id: string;
    project_id: string;
    youtube_id: string;
    title: string | null;
    description: string | null;
    tags: string[] | null;
    category_id: string | null;
    channel_id: string | null;
    channel_title: string | null;
    thumbnail_url: string | null;
    view_count: number;
    like_count: number;
    comment_count: number;
    duration: string | null;
    published_at: string | null;
    engagement_rate: number | null;
    view_velocity: number | null;
    combined_score: number | null;
    embedding: number[] | null;
    created_at: string;
}

export interface TubeCloneAnalysis {
    id: string;
    project_id: string;
    user_title: string | null;
    user_description: string | null;
    user_tags: string[] | null;
    user_embedding: number[] | null;
    top_video_ids: string[] | null;
    pattern_analysis: PatternAnalysis | null;
    scores: AnalysisScores | null;
    suggestions: AnalysisSuggestions | null;
    validation_score: number | null;
    created_at: string;
    updated_at: string;
}

export interface PatternAnalysis {
    titlePatterns: string[];
    descriptionPatterns: string[];
    keywordClusters: { name: string; keywords: string[] }[];
}

export interface AnalysisScores {
    homepage: number;
    suggested: number;
    cpi: number;
    gaps: string[];
}

export interface AnalysisSuggestions {
    titleVariants: string[];
    optimizedDescription: string;
    suggestedTags: string[];
}

export type ResearchStep =
    | 'config'      // Step 1: Input configuration
    | 'search'      // Step 2: Search results
    | 'filter'      // Step 3: Top videos
    | 'embed'       // Step 4: Embedding
    | 'input'       // Step 5: User input
    | 'analysis'    // Step 6: Analysis results
    | 'validation'; // Step 7: Validation

export interface ResearchConfig {
    sourceUrl: string;
    country: string;
    timeRange: string;
    videoLimit: number;
}
