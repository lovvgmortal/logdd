import { callOpenRouter, extractJsonFromResponse, ChatMessage } from "./openrouter";
import {
  DNA_EXTRACTION_PROMPT,
  SCAN_PROMPT,
  DNA_EVOLUTION_PROMPT,
  STRUCTURE_ANALYSIS_PROMPT,
  PATTERN_ENRICHMENT_PROMPT
} from "@/prompts/dna";

// Extended DNA interface matching the detailed analysis UI
export interface ExtractedDNA {
  // Basic info
  name: string;
  niche: string;
  targetWordCount?: number;

  // Audience Psychology
  audiencePsychology: string;

  // Voice Profile (CONSOLIDATED - gộp tone + pacing + linguisticFingerprint)
  voiceProfile: {
    personaRole: string; // Mentor, Guide, Insider, etc.
    toneAnalysis: string; // Detailed tone description
    syntaxPatterns?: string; // Sentence structure patterns
    signatureKeywords: string[]; // 5-7 keywords max
    globalPacing: string; // Linguistic rhythm (not video editing)
  };

  // Hook Angle (Psychology)
  hookAngle: {
    angleCategory: string;
    deconstruction: string;
  };

  // Emotional Arc
  emotionalArc?: {
    section: string;
    emotion: string;
  }[];

  // Structural Skeleton (TỐI ƯU - giảm 12 fields → 6 fields cốt lõi)
  structuralSkeleton: {
    title: string;
    wordCount: number;
    tone?: string;
    pacing?: string;
    keyFocus?: string; // Renamed from contentFocus
    audienceValue?: string; // Giá trị cho audience
  }[];

  // Patterns (CONSOLIDATED - gộp corePatterns + viralXFactors với tags)
  patterns: {
    pattern: string;
    tag: 'safe' | 'experimental'; // safe = xuất hiện 2+ videos, experimental = unique
  }[];

  // Persuasion Flow (GIỮ LẠI - kỹ thuật dẫn dắt)
  persuasionFlow: {
    framework: 'PAS' | 'BAB' | 'Story-Based' | 'Custom';
    proofSequence: Array<'personal-story' | 'data' | 'case-study' | 'expert-quote' | 'social-proof'>;
    objectionHandling: {
      placement: string;
      mainObjection: string;
      counterTactic: string;
    };
    logicalProgression: string[];
  };

  // Retention Hooks (GIỮ LẠI - word count based)
  retentionHooks: {
    atWordCount: number;
    technique: string;
    example: string;
  }[];

  // Transitions (GIỮ LẠI - công thức chuyển section)
  transitions: {
    from: string;
    to: string;
    formula: string;
    example?: string;
  }[];

  // Friction Points (CONSOLIDATED - gộp confusionPoints + objections, XÓA flopAvoidance vì duplicate)
  frictionPoints: {
    type: 'confusion' | 'objection' | 'anti-pattern';
    point: string;
    atWordCount?: number;
    solution?: string;
  }[];

  // High Dopamine Elements (GIỮ NGUYÊN)
  highDopamine: string[];

  // Legacy fields for backward compatibility
  linguisticFingerprint?: {
    personaRole: string;
    toneAnalysis: string;
    syntaxPatterns?: string;
    signatureKeywords: string[];
  };
  pacingAndTone?: { pacing: string };
  confusionPoints?: string[];
  objections?: string[];
  corePatterns?: string[];
  viralXFactors?: string[];
  tone?: string;
  patterns_legacy?: string[];
  vocabulary?: string;
  hook_type?: string;
  hook_examples?: string[];
  structure?: string[];
  pacing?: string;
  retention_tactics?: string[];
  x_factors?: string[];
}

export interface ExtractionInput {
  viralVideos: {
    title: string;
    transcript: string;
    comments: string;
    notes: string;
  }[];
  flopVideos: {
    title: string;
    transcript: string;
    comments: string;
    notes: string;
  }[];
  overrideLogic?: string;
  language?: string;
}

// New interfaces for 2-step extraction
export interface VideoStructure {
  videoIndex: number;
  totalWords: number;
  sections: {
    title: string;
    wordCount: number;
    startWord: number;
    endWord: number;
    functionalType: string;
  }[];
}

export interface ConsensusStructure {
  title: string;
  wordCount: number;
  functionalType: string;
  rationale?: string;
}

export interface StructureAnalysisResult {
  videoStructures: VideoStructure[];
  consensusStructure: ConsensusStructure[];
}

// New interface for Scan results
export interface ContentScanResult {
  index: number;
  type: "viral" | "flop";
  title: string;
  topic: string;
  tone: string;
  qualityScore: number; // 0-100
  isOutlier: boolean;
  reason?: string;
  wordCount: number;
}

// ============================================================================
// HELPER: Convert old DNA format to new consolidated format
// ============================================================================

/**
 * Convert legacy DNA extraction result to new ExtractedDNA format
 * Handles backward compatibility and consolidation
 */
const convertToNewDNAFormat = (rawDna: any, targetWordCount: number): ExtractedDNA => {
  // Consolidate voiceProfile (merge tone + pacing + linguisticFingerprint)
  const voiceProfile = {
    personaRole: rawDna.linguisticFingerprint?.personaRole || rawDna.voiceProfile?.personaRole || "",
    toneAnalysis: rawDna.linguisticFingerprint?.toneAnalysis || rawDna.voiceProfile?.toneAnalysis || "",
    syntaxPatterns: rawDna.linguisticFingerprint?.syntaxPatterns || rawDna.voiceProfile?.syntaxPatterns || "",
    signatureKeywords: (rawDna.linguisticFingerprint?.signatureKeywords || rawDna.voiceProfile?.signatureKeywords || []).slice(0, 7),
    globalPacing: rawDna.pacingAndTone?.pacing || rawDna.voiceProfile?.globalPacing || rawDna.pacing || "medium"
  };

  // Consolidate patterns (merge corePatterns + viralXFactors with tags)
  const patterns = [
    ...(rawDna.corePatterns || []).map((p: string) => ({ pattern: p, tag: 'safe' as const })),
    ...(rawDna.viralXFactors || []).map((p: string) => ({ pattern: p, tag: 'experimental' as const }))
  ];

  // Consolidate frictionPoints (merge confusionPoints + objections + flopAvoidance)
  const frictionPoints = [
    ...(rawDna.confusionPoints || []).map((p: string) => ({
      type: 'confusion' as const,
      point: p,
      solution: undefined
    })),
    ...(rawDna.objections || []).map((p: string) => ({
      type: 'objection' as const,
      point: p,
      solution: undefined
    })),
    ...(rawDna.flopAvoidance || []).map((p: string) => ({
      type: 'anti-pattern' as const,
      point: p,
      solution: undefined
    }))
  ];

  // Default persuasionFlow if not provided
  const persuasionFlow = rawDna.persuasionFlow || {
    framework: 'Custom' as const,
    proofSequence: ['personal-story', 'data'] as Array<'personal-story' | 'data' | 'case-study' | 'expert-quote' | 'social-proof'>,
    objectionHandling: {
      placement: "after-solution-before-proof",
      mainObjection: rawDna.objections?.[0] || "skepticism",
      counterTactic: "provide evidence and social proof"
    },
    logicalProgression: ["Establish credibility", "Present problem", "Offer solution", "Prove with evidence"]
  };

  // Default retentionHooks if not provided
  const retentionHooks = rawDna.retentionHooks || [
    { atWordCount: 200, technique: "pattern-interrupt", example: "Reframe the core problem" },
    { atWordCount: 500, technique: "teaser", example: "Preview upcoming insight" }
  ];

  // Default transitions if not provided
  const transitions = rawDna.transitions || [];

  return {
    name: rawDna.name || "Extracted DNA",
    niche: rawDna.niche || "",
    targetWordCount,
    audiencePsychology: rawDna.audiencePsychology || "",
    voiceProfile,
    hookAngle: rawDna.hookAngle || { angleCategory: "", deconstruction: "" },
    emotionalArc: rawDna.emotionalArc || [],
    structuralSkeleton: rawDna.structuralSkeleton || [],
    patterns,
    persuasionFlow,
    retentionHooks,
    transitions,
    frictionPoints,
    highDopamine: rawDna.highDopamine || [],

    // Legacy fields for backward compatibility
    linguisticFingerprint: rawDna.linguisticFingerprint,
    pacingAndTone: rawDna.pacingAndTone,
    confusionPoints: rawDna.confusionPoints,
    objections: rawDna.objections,
    corePatterns: rawDna.corePatterns,
    viralXFactors: rawDna.viralXFactors,
    tone: rawDna.pacingAndTone?.tone || rawDna.tone || "",
    patterns_legacy: rawDna.corePatterns || [],
    vocabulary: rawDna.linguisticFingerprint?.signatureKeywords?.join(", ") || "",
    hook_type: rawDna.hookAngle?.angleCategory || "",
    hook_examples: rawDna.hook_examples || [],
    structure: rawDna.structuralSkeleton?.map((s: any) => s.title) || [],
    pacing: rawDna.pacingAndTone?.pacing || rawDna.pacing || "",
    retention_tactics: rawDna.highDopamine || [],
    x_factors: rawDna.viralXFactors || []
  };
};

// ============================================================================
// PRE-SCAN - Content Quality & Outlier Detection
// ============================================================================

// Prompt for Pre-Scan (Fast/Cheap)
// SCAN_PROMPT is imported from @/prompts/dna

export const scanContent = async (
  input: ExtractionInput,
  apiKey: string,
  model: string = "google/gemini-3-flash-preview" // Use Flash for speed
): Promise<ContentScanResult[]> => {
  if (!apiKey) throw new Error("API Key required");

  // Prepare minimal content for scanning (Title + first 500 chars of transcript)
  const viralSummary = input.viralVideos.map((v, i) =>
    `VIDEO #${i} (VIRAL): Title: ${v.title}. Transcript: ${v.transcript?.substring(0, 500)}...`
  ).join("\n\n");

  const flopSummary = input.flopVideos.map((v, i) =>
    `VIDEO #${i} (FLOP): Title: ${v.title}. Transcript: ${v.transcript?.substring(0, 500)}...`
  ).join("\n\n");

  const contentSummary = [viralSummary, flopSummary].filter(Boolean).join("\n\n---\n\n");

  const messages: ChatMessage[] = [
    { role: "system", content: SCAN_PROMPT },
    { role: "user", content: contentSummary }
  ];

  const response = await callOpenRouter(messages, apiKey, model);
  const results = extractJsonFromResponse(response);

  // Normalize results and map back to source inputs
  return results.map((res: any) => {
    const isViral = res.type?.toLowerCase() === "viral" || (!res.type && res.index < input.viralVideos.length); // Fallback logic
    const video = isViral ? input.viralVideos[res.index] : input.flopVideos[res.index];

    return {
      ...res,
      type: isViral ? "viral" : "flop",
      title: video?.title,
      wordCount: video?.transcript?.split(/\s+/).length || 0
    };
  });
};

// ============================================================================
// 2-STEP DNA EXTRACTION - Structure First, Then Patterns
// ============================================================================

/**
 * Step 1: Extract structural skeleton only
 */
export const extractStructure = async (
  input: ExtractionInput,
  apiKey: string,
  model: string = "google/gemini-3-flash-preview"
): Promise<StructureAnalysisResult> => {
  if (!apiKey) {
    throw new Error("OpenRouter API Key chưa được cấu hình.");
  }

  // Build user content with all videos
  let contentParts: string[] = [];

  input.viralVideos.forEach((video, i) => {
    contentParts.push(`=== VIRAL VIDEO ${i + 1}: ${video.title || 'Untitled'} ===`);
    if (video.transcript) contentParts.push(`TRANSCRIPT:\n${video.transcript}`);
  });

  // Add flops for contrast
  if (input.flopVideos.length > 0) {
    input.flopVideos.forEach((video, i) => {
      contentParts.push(`=== FLOP (AVOID) ${i + 1}: ${video.title} ===`);
      contentParts.push(`TRANSCRIPT:\n${video.transcript}`);
    });
  }

  const userContent = contentParts.join("\n\n");

  const messages: ChatMessage[] = [
    { role: "system", content: STRUCTURE_ANALYSIS_PROMPT },
    { role: "user", content: `Analyze structures and find consensus:\n\n${userContent}` }
  ];

  const response = await callOpenRouter(messages, apiKey, model);
  return extractJsonFromResponse(response);
};

/**
 * Step 2: Enrich structure with patterns and metadata
 */
export const enrichStructureWithPatterns = async (
  consensusStructure: ConsensusStructure[],
  input: ExtractionInput,
  apiKey: string,
  model: string = "google/gemini-3-flash-preview"
): Promise<ExtractedDNA> => {
  if (!apiKey) {
    throw new Error("OpenRouter API Key chưa được cấu hình.");
  }

  // Build content with structure reference
  let userContent = `=== PRE-DEFINED CONSENSUS STRUCTURE ===\n`;
  userContent += JSON.stringify(consensusStructure, null, 2);
  userContent += `\n\n=== VIDEO TRANSCRIPTS FOR ANALYSIS ===\n\n`;

  input.viralVideos.forEach((video, i) => {
    userContent += `VIRAL VIDEO ${i + 1}: ${video.title}\n`;
    userContent += `TRANSCRIPT: ${video.transcript}\n`;
    if (video.comments) userContent += `COMMENTS: ${video.comments}\n`;
    userContent += `\n`;
  });

  if (input.flopVideos.length > 0) {
    userContent += `\n=== FLOP VIDEOS (FOR ANTI-PATTERNS) ===\n\n`;
    input.flopVideos.forEach((video, i) => {
      userContent += `FLOP ${i + 1}: ${video.title}\n`;
      userContent += `TRANSCRIPT: ${video.transcript}\n\n`;
    });
  }

  const messages: ChatMessage[] = [
    { role: "system", content: PATTERN_ENRICHMENT_PROMPT },
    { role: "user", content: userContent }
  ];

  const response = await callOpenRouter(messages, apiKey, model);
  const enrichedDna = extractJsonFromResponse(response);

  // Calculate target word count
  const validTranscripts = input.viralVideos.filter(v => v.transcript);
  const totalWords = validTranscripts.reduce((acc, v) => acc + (v.transcript?.split(/\s+/).length || 0), 0);
  const avgWordCount = validTranscripts.length > 0 ? Math.round(totalWords / validTranscripts.length) : 0;

  return convertToNewDNAFormat(enrichedDna, avgWordCount);
};

/**
 * Main 2-step extraction function
 */
export const extractDnaWithTwoSteps = async (
  input: ExtractionInput,
  apiKey: string,
  model: string = "google/gemini-3-flash-preview"
): Promise<ExtractedDNA> => {
  // Step 1: Extract structure
  const structureResult = await extractStructure(input, apiKey, model);

  // Step 2: Enrich with patterns
  const enrichedDna = await enrichStructureWithPatterns(
    structureResult.consensusStructure,
    input,
    apiKey,
    model
  );

  return enrichedDna;
};


export const extractDnaFromContent = async (
  input: ExtractionInput,
  apiKey: string,
  model: string = "google/gemini-3-flash-preview" // User selected model
): Promise<ExtractedDNA> => {
  if (!apiKey) {
    throw new Error("OpenRouter API Key chưa được cấu hình.");
  }

  // 1. Calculate Average Word Count (The "Standard")
  const validTranscripts = input.viralVideos.filter(v => v.transcript);
  const totalWords = validTranscripts.reduce((acc, v) => acc + (v.transcript?.split(/\s+/).length || 0), 0);
  const avgWordCount = validTranscripts.length > 0 ? Math.round(totalWords / validTranscripts.length) : 0;

  // 2. Batching Strategy (3 scripts per batch to preserve context window)
  const BATCH_SIZE = 3;
  const batches = [];
  for (let i = 0; i < input.viralVideos.length; i += BATCH_SIZE) {
    batches.push(input.viralVideos.slice(i, i + BATCH_SIZE));
  }

  const batchResults: any[] = [];

  // Process Batches
  for (const batch of batches) {
    let contentParts: string[] = [];
    batch.forEach((video, i) => {
      contentParts.push(`=== VIRAL VIDEO ${i + 1}: ${video.title || 'Untitled'} ===`);
      if (video.transcript) contentParts.push(`TRANSCRIPT:\n${video.transcript}`);
      if (video.comments) contentParts.push(`COMMENTS:\n${video.comments}`);
    });

    // Add Flops only to the first batch to establish contrast (save tokens)
    if (batchResults.length === 0 && input.flopVideos.length > 0) {
      input.flopVideos.forEach((video, i) => {
        contentParts.push(`=== FLOP (AVOID) ${i + 1}: ${video.title} ===`);
        contentParts.push(`TRANSCRIPT:\n${video.transcript}`);
      });
    }

    const userContent = contentParts.join("\n\n");

    // Inject Average Word Count into Prompt
    let systemPrompt = DNA_EXTRACTION_PROMPT.replace(
      "Extract the complete",
      `AVERAGE WORD COUNT: ${avgWordCount} words.\nExtract the complete`
    );

    if (input.overrideLogic) systemPrompt += `\n\nADDITIONAL: ${input.overrideLogic}`;

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Analyze batch and extract DNA:\n\n${userContent}` }
    ];

    const response = await callOpenRouter(messages, apiKey, model);
    batchResults.push(extractJsonFromResponse(response));
  }

  // 3. Aggregation (Intelligent Merge)
  // Merge all batch results using consensus-based algorithm
  const mergedResult = mergeBatchResults(batchResults, avgWordCount);

  // Convert to new ExtractedDNA format
  return convertToNewDNAFormat(mergedResult, avgWordCount);
};

// Legacy function for backward compatibility
export const extractDnaFromTranscript = async (
  transcript: string,
  apiKey: string,
  model: string = "google/gemini-3-flash-preview",
  url?: string
): Promise<ExtractedDNA> => {
  return extractDnaFromContent(
    {
      viralVideos: [{ title: "", transcript, comments: "", notes: url ? `Source: ${url}` : "" }],
      flopVideos: []
    },
    apiKey,
    model
  );
};

// ============================================================================
// DNA EVOLUTION - AI Learning & Refinement
// ============================================================================

export interface DnaEvolutionResult {
  evolvedDna: ExtractedDNA;
  changesSummary: string[];
}

export interface LearningHistoryEntry {
  id: string;
  timestamp: string;
  input_type: 'viral' | 'flop' | 'mixed';
  source_urls?: string[];
  transcript_preview: string;
  changes_made: string[];
}

// ============================================================================
// STRUCTURE VALIDATION - Enforce reasonable section word counts
// ============================================================================

const validateAndFixSkeleton = (skeleton: any[], targetWordCount: number = 0): any[] => {
  if (!skeleton || skeleton.length === 0) return skeleton;

  // 1. Calculate current structure total
  const currentTotal = skeleton.reduce((sum, s) => sum + (s.wordCount || 0), 0);

  // 2. If we have a target and current is valid but mismatched, SCALE PROPORTIONALLY
  if (targetWordCount > 0 && currentTotal > 0) {
    const scaleFactor = targetWordCount / currentTotal;

    // Only scale if there's a significant deviation (> 10%)
    if (Math.abs(scaleFactor - 1) > 0.1) {
      console.log(`[DNA Validation] Scaling structure from ${currentTotal} to ${targetWordCount} (x${scaleFactor.toFixed(2)})`);
      return skeleton.map(section => ({
        ...section,
        wordCount: Math.round((section.wordCount || 0) * scaleFactor)
      }));
    }
  }

  // 3. Fallback: If no target or 0 sum, apply generous sanity bounds (not strict clamping)
  const MIN_WORDS = 30; // Minimum for any section
  return skeleton.map(section => ({
    ...section,
    wordCount: Math.max(section.wordCount || MIN_WORDS, MIN_WORDS)
  }));
};

// ============================================================================
// INTELLIGENT BATCH MERGING - Combine insights from multiple DNA extractions
// ============================================================================

/**
 * Merge multiple DNA extraction results intelligently
 * Strategy: Prioritize patterns that appear in multiple batches (consensus)
 */
const mergeBatchResults = (batchResults: any[], avgWordCount: number): any => {
  if (batchResults.length === 0) {
    throw new Error("No batch results to merge");
  }

  if (batchResults.length === 1) {
    const result = { ...batchResults[0], targetWordCount: avgWordCount };
    // Validate skeleton
    if (result.structuralSkeleton) {
      result.structuralSkeleton = validateAndFixSkeleton(result.structuralSkeleton, avgWordCount);
    }
    return result;
  }

  // Helper: Count frequency of items across batches
  const mergeArraysByFrequency = (arrays: string[][], minFrequency = 0.5): string[] => {
    const itemCount = new Map<string, number>();
    const totalBatches = arrays.length;

    arrays.forEach(arr => {
      if (!arr) return;
      const uniqueItems = [...new Set(arr)];
      uniqueItems.forEach(item => {
        itemCount.set(item, (itemCount.get(item) || 0) + 1);
      });
    });

    // Filter by frequency threshold and sort by frequency
    return Array.from(itemCount.entries())
      .filter(([_, count]) => count / totalBatches >= minFrequency)
      .sort((a, b) => b[1] - a[1])
      .map(([item]) => item);
  };

  // Helper: Merge structural skeletons - find consensus structure
  const mergeStructuralSkeletons = (skeletons: any[][]): any[] => {
    if (!skeletons || skeletons.length === 0) return [];

    // Use the skeleton with median length as base
    const validSkeletons = skeletons.filter(s => s && s.length > 0);
    if (validSkeletons.length === 0) return [];

    validSkeletons.sort((a, b) => a.length - b.length);
    const medianSkeleton = validSkeletons[Math.floor(validSkeletons.length / 2)];

    // Enhance with insights from other skeletons
    return medianSkeleton.map((section, idx) => {
      // Collect all sections at this index from other skeletons
      const equivalentSections = validSkeletons
        .map(skel => skel[idx])
        .filter(Boolean);

      // Average word counts
      const wordCounts = equivalentSections.map(s => s.wordCount || 0).filter(wc => wc > 0);
      const avgWordCount = wordCounts.length > 0
        ? Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length)
        : section.wordCount;

      return {
        ...section,
        wordCount: avgWordCount
      };
    });
  };

  // Helper: Pick most detailed non-empty string
  const pickBestString = (strings: (string | undefined)[]): string => {
    const valid = strings.filter(s => s && s.trim().length > 0);
    if (valid.length === 0) return "";
    // Pick longest as it's likely most detailed
    return valid.reduce((longest, current) =>
      current.length > longest.length ? current : longest
    );
  };

  // Extract arrays for merging
  const allCorePatterns = batchResults.map(r => r.corePatterns).filter(Boolean);
  const allViralXFactors = batchResults.map(r => r.viralXFactors).filter(Boolean);
  const allFlopAvoidance = batchResults.map(r => r.flopAvoidance).filter(Boolean);
  const allHighDopamine = batchResults.map(r => r.highDopamine).filter(Boolean);
  const allConfusionPoints = batchResults.map(r => r.confusionPoints).filter(Boolean);
  const allObjections = batchResults.map(r => r.objections).filter(Boolean);
  const allStructuralSkeletons = batchResults.map(r => r.structuralSkeleton).filter(Boolean);

  // Merge with frequency threshold (appear in 50%+ of batches)
  const merged = {
    // Pick best name and niche (most detailed)
    name: pickBestString(batchResults.map(r => r.name)),
    niche: pickBestString(batchResults.map(r => r.niche)),
    targetWordCount: avgWordCount,

    // Pick best detailed explanations (longest = most detailed)
    audiencePsychology: pickBestString(batchResults.map(r => r.audiencePsychology)),

    // Linguistic Fingerprint - merge keywords, pick best analysis
    linguisticFingerprint: {
      personaRole: pickBestString(batchResults.map(r => r.linguisticFingerprint?.personaRole)),
      toneAnalysis: pickBestString(batchResults.map(r => r.linguisticFingerprint?.toneAnalysis)),
      syntaxPatterns: pickBestString(batchResults.map(r => r.linguisticFingerprint?.syntaxPatterns)),
      signatureKeywords: mergeArraysByFrequency(
        batchResults.map(r => r.linguisticFingerprint?.signatureKeywords).filter(Boolean),
        0.4 // 40% threshold for keywords (more lenient)
      )
    },

    // Hook Angle - pick most detailed
    hookAngle: batchResults
      .map(r => r.hookAngle)
      .filter(h => h && h.deconstruction)
      .sort((a, b) => (b.deconstruction?.length || 0) - (a.deconstruction?.length || 0))[0] ||
      { angleCategory: "", deconstruction: "" },

    // Pacing - consensus or most common
    pacingAndTone: {
      pacing: pickBestString(batchResults.map(r => r.pacingAndTone?.pacing))
    },

    // Emotional Arc - pick from most detailed result
    emotionalArc: batchResults
      .map(r => r.emotionalArc)
      .filter(e => e && e.length > 0)
      .sort((a, b) => b.length - a.length)[0] || [],

    // Structural Skeleton - merge intelligently and validate
    structuralSkeleton: validateAndFixSkeleton(mergeStructuralSkeletons(allStructuralSkeletons), avgWordCount),

    // Array merging - prioritize patterns appearing in multiple batches
    corePatterns: mergeArraysByFrequency(allCorePatterns, 0.5), // 50%+ batches
    viralXFactors: mergeArraysByFrequency(allViralXFactors, 0.4), // 40%+ (more lenient for unique factors)
    flopAvoidance: mergeArraysByFrequency(allFlopAvoidance, 0.5), // 50%+ batches
    highDopamine: mergeArraysByFrequency(allHighDopamine, 0.5),
    confusionPoints: mergeArraysByFrequency(allConfusionPoints, 0.3), // Lower threshold for warnings
    objections: mergeArraysByFrequency(allObjections, 0.4)
  };

  return merged;
};

// DNA_EVOLUTION_PROMPT is imported from @/prompts/dna

export const evolveDna = async (
  existingDna: ExtractedDNA,
  newContent: {
    viralVideos?: Array<{ transcript: string; url?: string }>;
    flopVideos?: Array<{ transcript: string; url?: string }>;
  },
  apiKey: string,
  model: string = "google/gemini-3-flash-preview"
): Promise<DnaEvolutionResult> => {
  if (!apiKey) {
    throw new Error("OpenRouter API Key chưa được cấu hình.");
  }

  // Build the user prompt with existing DNA and new content
  let userPrompt = `EXISTING DNA TO EVOLVE:\n\`\`\`json\n${JSON.stringify(existingDna, null, 2)}\n\`\`\`\n\n`;

  if (newContent.viralVideos && newContent.viralVideos.length > 0) {
    userPrompt += `NEW VIRAL VIDEOS TO LEARN FROM:\n`;
    newContent.viralVideos.forEach((video, i) => {
      userPrompt += `\n--- VIRAL VIDEO ${i + 1} ${video.url ? `(${video.url})` : ''} ---\n`;
      userPrompt += video.transcript.substring(0, 4000); // Limit transcript length
      userPrompt += `\n`;
    });
    userPrompt += `\n`;
  }

  if (newContent.flopVideos && newContent.flopVideos.length > 0) {
    userPrompt += `NEW FLOP VIDEOS TO LEARN MISTAKES FROM:\n`;
    newContent.flopVideos.forEach((video, i) => {
      userPrompt += `\n--- FLOP VIDEO ${i + 1} ${video.url ? `(${video.url})` : ''} ---\n`;
      userPrompt += video.transcript.substring(0, 4000); // Limit transcript length
      userPrompt += `\n`;
    });
    userPrompt += `\n`;
  }

  userPrompt += `\nAnalyze the new content, learn from it, and EVOLVE the DNA. Return the complete evolved DNA and a summary of changes.`;

  const messages: ChatMessage[] = [
    { role: "system", content: DNA_EVOLUTION_PROMPT },
    { role: "user", content: userPrompt }
  ];

  const response = await callOpenRouter(messages, apiKey, model);
  const result = extractJsonFromResponse(response);

  // Convert evolved DNA to new format
  const evolvedDna = convertToNewDNAFormat(
    result.evolvedDna || existingDna,
    result.evolvedDna?.targetWordCount || existingDna.targetWordCount || 0
  );

  return {
    evolvedDna,
    changesSummary: result.changesSummary || ["Evolution completed without detailed changes"]
  };
};
