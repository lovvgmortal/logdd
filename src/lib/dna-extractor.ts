import { callOpenRouter, extractJsonFromResponse, ChatMessage } from "./openrouter";
import { DNA_EXTRACTION_PROMPT, SCAN_PROMPT, DNA_EVOLUTION_PROMPT } from "@/prompts/dna";

// Extended DNA interface matching the detailed analysis UI
export interface ExtractedDNA {
  // Basic info
  name: string;
  niche: string;
  targetWordCount?: number;

  // Audience Psychology
  audiencePsychology: string;

  // Linguistic Fingerprint (The Voice)
  linguisticFingerprint: {
    personaRole: string;
    toneAnalysis: string;
    syntaxPatterns?: string;
    signatureKeywords: string[];
  };

  // Hook Angle (Psychology)
  hookAngle: {
    angleCategory: string;
    deconstruction: string;
  };

  // Pacing (Global)
  pacingAndTone: {
    pacing: string;
  };

  // Emotional Arc (New)
  emotionalArc?: {
    section: string;
    emotion: string;
  }[];

  // Structural Skeleton (Advanced)
  structuralSkeleton: {
    title: string;
    wordCount: number;
    tone?: string;
    pacing?: string;
    contentFocus?: string;
    openLoop?: string;
    closesLoop?: string;
    audienceInteraction?: string;
    antiPattern?: string;
    audienceValue?: string;
    transitionOut?: string;
  }[];

  // High Dopamine (Keep)
  highDopamine: string[];

  // Confusion Points (Fix)
  confusionPoints: string[];

  // Objections (Address)
  objections: string[];

  // Core Patterns (70% Safe)
  corePatterns: string[];

  // Viral X-Factors (30% Magic)
  viralXFactors: string[];

  // Flop Avoidance
  flopAvoidance: string[];

  // Legacy fields for database compatibility
  tone?: string;
  patterns?: string[];
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

  return {
    name: mergedResult.name || "Extracted DNA",
    niche: mergedResult.niche || "",
    targetWordCount: mergedResult.targetWordCount,
    audiencePsychology: mergedResult.audiencePsychology || "",
    linguisticFingerprint: mergedResult.linguisticFingerprint || { personaRole: "", toneAnalysis: "", signatureKeywords: [] },
    hookAngle: mergedResult.hookAngle || { angleCategory: "", deconstruction: "" },
    pacingAndTone: mergedResult.pacingAndTone || { pacing: "", tone: "" },
    emotionalArc: mergedResult.emotionalArc || [],
    structuralSkeleton: mergedResult.structuralSkeleton || [],
    highDopamine: mergedResult.highDopamine || [],
    confusionPoints: mergedResult.confusionPoints || [],
    objections: mergedResult.objections || [],
    corePatterns: mergedResult.corePatterns || [],
    viralXFactors: mergedResult.viralXFactors || [],
    flopAvoidance: mergedResult.flopAvoidance || [],

    // Legacy mapping
    tone: mergedResult.pacingAndTone?.tone || "",
    patterns: mergedResult.corePatterns || [],
    vocabulary: mergedResult.linguisticFingerprint?.signatureKeywords?.join(", ") || "",
    hook_type: mergedResult.hookAngle?.angleCategory || "",
    hook_examples: [],
    structure: mergedResult.structuralSkeleton?.map((s: any) => s.title) || [],
    pacing: mergedResult.pacingAndTone?.pacing || "",
    retention_tactics: mergedResult.highDopamine || [],
    x_factors: mergedResult.viralXFactors || [],
  };
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
    return { ...batchResults[0], targetWordCount: avgWordCount };
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

    // Structural Skeleton - merge intelligently
    structuralSkeleton: mergeStructuralSkeletons(allStructuralSkeletons),

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

  // Ensure the evolved DNA has all required fields
  const evolvedDna: ExtractedDNA = {
    name: result.evolvedDna?.name || existingDna.name,
    niche: result.evolvedDna?.niche || existingDna.niche,
    targetWordCount: result.evolvedDna?.targetWordCount || existingDna.targetWordCount,
    audiencePsychology: result.evolvedDna?.audiencePsychology || existingDna.audiencePsychology,
    linguisticFingerprint: result.evolvedDna?.linguisticFingerprint || existingDna.linguisticFingerprint,
    hookAngle: result.evolvedDna?.hookAngle || existingDna.hookAngle,
    pacingAndTone: result.evolvedDna?.pacingAndTone || existingDna.pacingAndTone,
    structuralSkeleton: result.evolvedDna?.structuralSkeleton || existingDna.structuralSkeleton,
    highDopamine: result.evolvedDna?.highDopamine || existingDna.highDopamine,
    confusionPoints: result.evolvedDna?.confusionPoints || existingDna.confusionPoints,
    objections: result.evolvedDna?.objections || existingDna.objections,
    corePatterns: result.evolvedDna?.corePatterns || existingDna.corePatterns,
    viralXFactors: result.evolvedDna?.viralXFactors || existingDna.viralXFactors,
    flopAvoidance: result.evolvedDna?.flopAvoidance || existingDna.flopAvoidance,
    hook_examples: result.evolvedDna?.hook_examples || existingDna.hook_examples || [],
    // Legacy fields
    tone: result.evolvedDna?.tone || existingDna.tone,
    patterns: result.evolvedDna?.patterns || existingDna.patterns,
    vocabulary: result.evolvedDna?.vocabulary || existingDna.vocabulary,
    hook_type: result.evolvedDna?.hook_type || existingDna.hook_type,
    structure: result.evolvedDna?.structure || existingDna.structure,
    pacing: result.evolvedDna?.pacing || existingDna.pacing,
    retention_tactics: result.evolvedDna?.retention_tactics || existingDna.retention_tactics,
    x_factors: result.evolvedDna?.x_factors || existingDna.x_factors,
  };

  return {
    evolvedDna,
    changesSummary: result.changesSummary || ["Evolution completed without detailed changes"]
  };
};
