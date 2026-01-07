// TubeClone AI Prompts for Pattern Analysis and Optimization

import { callOpenRouter, extractJsonFromResponse, ChatMessage } from "./openrouter";

// Pattern extraction from top videos
export const PATTERN_EXTRACTION_PROMPT = `You are an expert YouTube SEO analyst. Analyze the metadata from these top-performing videos and extract patterns.

<top_videos>
{videos_data}
</top_videos>

Extract patterns that make these videos successful. Return ONLY valid JSON:

{
  "titlePatterns": [
    {
      "pattern": "Pattern description",
      "examples": ["Example 1", "Example 2"],
      "frequency": "high|medium|low"
    }
  ],
  "descriptionPatterns": [
    {
      "pattern": "Pattern description",
      "location": "first_line|opening|middle|cta",
      "examples": ["Example snippet"]
    }
  ],
  "keywordClusters": [
    {
      "name": "Cluster name",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "importance": "high|medium|low"
    }
  ],
  "commonElements": {
    "avgTitleLength": 50,
    "avgDescriptionLength": 500,
    "avgTagCount": 15,
    "powerWords": ["word1", "word2"],
    "emotionalTriggers": ["trigger1", "trigger2"]
  }
}`;

// Gap analysis and scoring
export const GAP_ANALYSIS_PROMPT = `You are an expert YouTube SEO analyst. Compare the user's video metadata against successful patterns and score it.

<successful_patterns>
{patterns}
</successful_patterns>

<user_metadata>
Title: {user_title}
Description: {user_description}
Tags: {user_tags}
</user_metadata>

Analyze gaps and score the metadata. Return ONLY valid JSON:

{
  "scores": {
    "homepage": 0-100,
    "suggested": 0-100,
    "cpi": 0-100,
    "titleScore": 0-100,
    "descriptionScore": 0-100,
    "tagsScore": 0-100
  },
  "gaps": [
    {
      "type": "title|description|tags|keyword",
      "issue": "Description of the issue",
      "severity": "high|medium|low",
      "suggestion": "How to fix it"
    }
  ],
  "strengths": [
    "What the user is doing well"
  ],
  "overallAnalysis": "Brief overall assessment"
}`;

// Title optimization
export const TITLE_OPTIMIZATION_PROMPT = `You are an expert YouTube title optimizer. Based on successful patterns, generate optimized title variants.

<successful_patterns>
{patterns}
</successful_patterns>

<current_title>
{user_title}
</current_title>

<topic_context>
{topic_context}
</topic_context>

Generate 5 optimized title variants that:
1. Follow successful patterns
2. Include power words and emotional triggers
3. Are 50-70 characters (optimal for display)
4. Maintain the core message

Return ONLY valid JSON:

{
  "variants": [
    {
      "title": "Optimized title",
      "reasoning": "Why this works",
      "patternsUsed": ["pattern1", "pattern2"],
      "predictedCTR": "high|medium|standard"
    }
  ]
}`;

// Description optimization
export const DESCRIPTION_OPTIMIZATION_PROMPT = `You are an expert YouTube description optimizer. Create an optimized description based on successful patterns.

<successful_patterns>
{patterns}
</successful_patterns>

<current_description>
{user_description}
</current_description>

<video_context>
Title: {video_title}
Tags: {video_tags}
</video_context>

Create an optimized description that:
1. Has a compelling first line (visible in search)
2. Includes relevant keywords naturally
3. Has clear structure with timestamps placeholder
4. Includes call-to-action
5. Is 500-1000 characters optimal

Return ONLY valid JSON:

{
  "optimizedDescription": "Full optimized description",
  "keyChanges": [
    "What was improved and why"
  ],
  "keywordsIncluded": ["keyword1", "keyword2"],
  "structure": {
    "hook": "First line",
    "mainContent": "Middle section summary",
    "cta": "Call to action"
  }
}`;

// Tags suggestions
export const TAGS_SUGGESTION_PROMPT = `You are an expert YouTube tags optimizer. Suggest optimal tags based on successful videos.

<successful_video_tags>
{top_video_tags}
</successful_video_tags>

<user_video>
Title: {user_title}
Description: {user_description}
Current Tags: {user_tags}
</user_video>

Suggest optimal tags that:
1. Include high-volume keywords from successful videos
2. Mix broad and specific tags
3. Include variations and synonyms
4. Total 15-30 tags (YouTube allows up to 500 characters)

Return ONLY valid JSON:

{
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "removeTags": ["tags that should be removed"],
  "tagCategories": {
    "primary": ["main topic tags"],
    "secondary": ["related topic tags"],
    "longtail": ["specific phrase tags"],
    "trending": ["trending/timely tags"]
  },
  "totalCharacters": 450
}`;

// Helper function to call pattern extraction
export async function extractPatterns(
    videosData: Array<{ title: string; description: string; tags: string[] }>,
    apiKey: string,
    model: string = "google/gemini-3-flash-preview"
): Promise<any> {
    const videosJson = JSON.stringify(videosData.slice(0, 10), null, 2);
    const prompt = PATTERN_EXTRACTION_PROMPT.replace("{videos_data}", videosJson);

    const messages: ChatMessage[] = [
        { role: "user", content: prompt }
    ];

    const response = await callOpenRouter(messages, apiKey, model);
    return extractJsonFromResponse(response);
}

// Helper function to analyze gaps
export async function analyzeGaps(
    patterns: any,
    userTitle: string,
    userDescription: string,
    userTags: string[],
    apiKey: string,
    model: string = "google/gemini-3-flash-preview"
): Promise<any> {
    const prompt = GAP_ANALYSIS_PROMPT
        .replace("{patterns}", JSON.stringify(patterns, null, 2))
        .replace("{user_title}", userTitle)
        .replace("{user_description}", userDescription)
        .replace("{user_tags}", userTags.join(", "));

    const messages: ChatMessage[] = [
        { role: "user", content: prompt }
    ];

    const response = await callOpenRouter(messages, apiKey, model);
    return extractJsonFromResponse(response);
}

// Helper function to optimize title
export async function optimizeTitle(
    patterns: any,
    userTitle: string,
    topicContext: string,
    apiKey: string,
    model: string = "google/gemini-3-flash-preview"
): Promise<any> {
    const prompt = TITLE_OPTIMIZATION_PROMPT
        .replace("{patterns}", JSON.stringify(patterns, null, 2))
        .replace("{user_title}", userTitle)
        .replace("{topic_context}", topicContext);

    const messages: ChatMessage[] = [
        { role: "user", content: prompt }
    ];

    const response = await callOpenRouter(messages, apiKey, model);
    return extractJsonFromResponse(response);
}

// Helper function to optimize description
export async function optimizeDescription(
    patterns: any,
    userDescription: string,
    videoTitle: string,
    videoTags: string[],
    apiKey: string,
    model: string = "google/gemini-3-flash-preview"
): Promise<any> {
    const prompt = DESCRIPTION_OPTIMIZATION_PROMPT
        .replace("{patterns}", JSON.stringify(patterns, null, 2))
        .replace("{user_description}", userDescription)
        .replace("{video_title}", videoTitle)
        .replace("{video_tags}", videoTags.join(", "));

    const messages: ChatMessage[] = [
        { role: "user", content: prompt }
    ];

    const response = await callOpenRouter(messages, apiKey, model);
    return extractJsonFromResponse(response);
}

// Helper function to suggest tags
export async function suggestTags(
    topVideoTags: string[][],
    userTitle: string,
    userDescription: string,
    userTags: string[],
    apiKey: string,
    model: string = "google/gemini-3-flash-preview"
): Promise<any> {
    const prompt = TAGS_SUGGESTION_PROMPT
        .replace("{top_video_tags}", JSON.stringify(topVideoTags, null, 2))
        .replace("{user_title}", userTitle)
        .replace("{user_description}", userDescription)
        .replace("{user_tags}", userTags.join(", "));

    const messages: ChatMessage[] = [
        { role: "user", content: prompt }
    ];

    const response = await callOpenRouter(messages, apiKey, model);
    return extractJsonFromResponse(response);
}

// Combined analysis function
export async function runFullAnalysis(
    topVideos: Array<{ title: string; description: string; tags: string[] }>,
    userTitle: string,
    userDescription: string,
    userTags: string[],
    apiKey: string,
    model: string = "google/gemini-3-flash-preview",
    onProgress?: (step: string) => void
): Promise<{
    patterns: any;
    gapAnalysis: any;
    titleVariants: any;
    optimizedDescription: any;
    suggestedTags: any;
}> {
    onProgress?.("Extracting patterns from top videos...");
    const patterns = await extractPatterns(topVideos, apiKey, model);

    onProgress?.("Analyzing gaps in your metadata...");
    const gapAnalysis = await analyzeGaps(patterns, userTitle, userDescription, userTags, apiKey, model);

    onProgress?.("Generating title variants...");
    const titleVariants = await optimizeTitle(patterns, userTitle, userDescription, apiKey, model);

    onProgress?.("Optimizing description...");
    const optimizedDescription = await optimizeDescription(patterns, userDescription, userTitle, userTags, apiKey, model);

    onProgress?.("Suggesting tags...");
    const suggestedTags = await suggestTags(
        topVideos.map(v => v.tags),
        userTitle,
        userDescription,
        userTags,
        apiKey,
        model
    );

    return {
        patterns,
        gapAnalysis,
        titleVariants,
        optimizedDescription,
        suggestedTags,
    };
}
