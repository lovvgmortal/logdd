import { callOpenRouter, extractJsonFromResponse, ChatMessage } from "./openrouter";

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

  // Structural Skeleton (Advanced)
  structuralSkeleton: {
    title: string;
    wordCount: number; // Estimated words
    tone?: string;
    pacing?: string; // Linguistic pacing
    contentFocus?: string;
    microHook?: string;
    openLoop?: string;
    viralTriggers?: string;
    mustInclude?: string[];
    audienceInteraction?: string;
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

const DNA_EXTRACTION_PROMPT = `You are an expert viral content DNA analyst using the "LOG" (Law of Gravity) methodology. 

Your Logic:
1.  **Analyze Viral Content**: Identify what consistently grabs attention and retains viewers.
2.  **Analyze Flop Content**: Identify why similar content failed (boring hooks, bad pacing, lack of payoff).
3.  **Contrast & Extract**: The "DNA" is the difference between the two. The X-Factors are elements present in Viral but absent or done poorly in Flop.

CONTEXT: The output script is for a VOICEOVER (Audio/Text only). **Pacing refers to the linguistic rhythm (sentence length, breath patterns, speed of delivery), NOT visual editing.**

Extract the complete "DNA" from the provided content (transcript, comments, title, etc).

Analyze and output a JSON with this EXACT structure:

{
  "name": "Suggested DNA name (e.g., 'The Financial Realist's Method')",
  "niche": "Content niche/category (e.g., Health & Fitness, Crypto, Gaming)",
  "targetWordCount": 3316,
  
  "audiencePsychology": "2-3 sentences describing the audience's emotional state, fears, desires...",
  
  "linguisticFingerprint": {
    "personaRole": "The persona/role the speaker adopts",
    "toneAnalysis": "Detailed tone analysis",
    "signatureKeywords": ["keyword1", "keyword2"]
  },
  
  "hookAngle": {
    "angleCategory": "Hook angle type",
    "deconstruction": "Psychological explanation"
  },
  
  "pacingAndTone": {
    "pacing": "Global detailed pacing analysis (sentence rhythm, delivery speed)"  },
  
  "structuralSkeleton": [
    {
      "title": "Section Name (e.g., Hook)",
      "wordCount": 150, // Approx words in this section
      "tone": "Specific tone for this section (e.g. Urgent, Inquisitive)",
      "pacing": "LINGUISTIC PACING & CONTRAST: Describe the mix of sentence lengths. NEVER be monotone. (e.g. 'Staccato short sentences [90%] ending with one long flow sentence [10%] for impact', or 'Long lyrical sentences broken by a single word punch').",
// ... (previous prompt content)
120:       "contentFocus": "ABSTRACT FORMULA of what happens here (e.g., 'Describe a catastrophic failure' NOT 'Describe John crashing his car'). GENERALIZE the events into a reusable formula.",
// ... (rest of prompt)
      "microHook": "Strategies for first 5s of this section (Optional)",
      "openLoop": "Curiosity gap opened here (Optional)",
      "viralTriggers": "Specific element causing engagement (Optional)",
      "mustInclude": ["Sound effect", "Visual metaphor"],
      "audienceInteraction": "CTA or engagement prompt (Optional)",
      "audienceValue": "What value does the viewer get? (Mandatory)",
      "transitionOut": "How to transition to next section (Optional)"
    }
  ],
  
  "highDopamine": ["Element 1"],
  "confusionPoints": ["Point 1"],
  "objections": ["Objection 1"],
  "corePatterns": ["Pattern 1"],
  "viralXFactors": ["X-Factor 1"],
  "flopAvoidance": ["Avoid 1"]
}

IMPORTANT:
- Analyze ALL provided inputs (transcript, comments, title, notes)
- Use comments to understand what resonated with audience
- Be specific and actionable in your analysis
- Keep descriptions detailed but concise
- For structuralSkeleton: Extract the ACTUAL structure from the transcript. Calculate the "wordCount" based on the actual transcript length. Pacing must be about WRITING STYLE and DELIVERY SPEED, not video editing.
- Global tone is in linguisticFingerprint.toneAnalysis. Section-specific tone goes in structuralSkeleton[i].tone.`;

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
const SCAN_PROMPT = `You are a Content Auditor. Scan the following video transcripts/comments.
For EACH video, determine:
1. Topic/Niche (1-2 words)
2. Primary Tone (1 adjective)
3. Quality Score (0-100 based on clarity and value)
4. Is it an "Outlier"? (True if it deviates significantly in Topic or Tone from the majority of the group)

Output JSON array:
[
  { "index": 0, "type": "viral", "topic": "...", "tone": "...", "qualityScore": 85, "isOutlier": false, "reason": "..." }
]`;

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

  // 3. Aggregation (Merge Batch Results)
  // For now, we take the most "detailed" result or average them.
  // Simple heuristic: The result with the longest structuralSkeleton is likely the most detailed.
  // Ideally, we'd have a separate "Merge" prompt, but for now we pick the 'best' candidate.

  const bestResult = batchResults.reduce((prev, current) => {
    return (current.structuralSkeleton?.length || 0) > (prev.structuralSkeleton?.length || 0) ? current : prev;
  }, batchResults[0]);

  // Force the calculated average word count
  bestResult.targetWordCount = avgWordCount;

  return {
    name: bestResult.name || "Extracted DNA",
    niche: bestResult.niche || "",
    targetWordCount: bestResult.targetWordCount,
    audiencePsychology: bestResult.audiencePsychology || "",
    linguisticFingerprint: bestResult.linguisticFingerprint || { personaRole: "", toneAnalysis: "", signatureKeywords: [] },
    hookAngle: bestResult.hookAngle || { angleCategory: "", deconstruction: "" },
    pacingAndTone: bestResult.pacingAndTone || { pacing: "", tone: "" },
    structuralSkeleton: bestResult.structuralSkeleton || [],
    highDopamine: bestResult.highDopamine || [],
    confusionPoints: bestResult.confusionPoints || [],
    objections: bestResult.objections || [],
    corePatterns: bestResult.corePatterns || [],
    viralXFactors: bestResult.viralXFactors || [],
    flopAvoidance: bestResult.flopAvoidance || [],

    // Legacy mapping
    tone: bestResult.pacingAndTone?.tone || "",
    patterns: bestResult.corePatterns || [],
    vocabulary: bestResult.linguisticFingerprint?.signatureKeywords?.join(", ") || "",
    hook_type: bestResult.hookAngle?.angleCategory || "",
    hook_examples: [],
    structure: bestResult.structuralSkeleton?.map((s: any) => s.title) || [],
    pacing: bestResult.pacingAndTone?.pacing || "",
    retention_tactics: bestResult.highDopamine || [],
    x_factors: bestResult.viralXFactors || [],
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

const DNA_EVOLUTION_PROMPT = `You are a DNA Evolution AI. Your job is to REFINE an existing Content DNA by learning from new video content.

You are NOT simply adding new items to lists. You are LEARNING and GENERALIZING.

CRITICAL RULES:
1. LEARN new patterns, hooks, tactics from viral videos
2. LEARN what to avoid from flop videos
3. COMPARE new insights with existing DNA patterns
4. MERGE similar patterns (don't create duplicates)
5. REPLACE weak/specific patterns with stronger/general ones
6. REMOVE redundant or conflicting patterns
7. **NO HARD LIMITS** - Keep what's valuable, quality over quantity
8. GENERALIZE - Extract principles, not just copy specific examples
9. If new content contradicts existing DNA, evaluate which is stronger and keep that

EVOLUTION LOGIC:
- If a new pattern is similar to an existing one → MERGE into one stronger pattern
- If a new pattern is clearly better → REPLACE the weak one
- If a new pattern is unique and valuable → ADD it  
- If existing patterns are now redundant → REMOVE them
- Hook examples: Prioritize newer ones but max 4-5 total (quality over quantity)

OUTPUT must be valid JSON:
{
  "evolvedDna": {
    // Complete updated DNA with all fields
  },
  "changesSummary": [
    // List of changes made, e.g.:
    // "Merged 'X pattern' and 'Y pattern' into 'Z pattern'",
    // "Replaced weak hook example with stronger one from viral #2",
    // "Added 'new insight' to flopAvoidance",
    // "Removed redundant item from corePatterns"
  ]
}`;

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
