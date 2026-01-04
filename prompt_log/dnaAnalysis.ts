
import { Type, Schema } from "@google/genai";
import { ContentPiece, ScriptDNA, OutputLanguage } from "../../types";
import { GEMINI_MODEL } from "../../constants";
import { DNA_SYSTEM_PROMPT, DNA_REFINEMENT_SYSTEM_PROMPT, constructDnaPrompt, constructDnaRefinementPrompt, getLanguageInstruction } from "./prompts";
import { generateContentViaOpenRouter } from "../openRouterService";

// Simplified Template for DNA to prevent Schema Hallucination
const dnaTemplate = {
  name: "Pattern Name",
  niche: "Industry/Category (e.g. Health, Finance, Gaming)",
  analysis: {
    pacing: "Description",
    tone: "Description",

    // UPGRADED STRUCTURE (Phase 1)
    structure_skeleton: [
      {
        section_name: "Hook",
        timing: "0-8s",
        word_count_range: "40-60",
        tone: "Urgent",
        pacing: "Fast cuts every 2s",
        content_focus: "Grab attention with shocking statement",
        must_include: ["Sound effect"],
        audience_value: "Instant curiosity and emotional hook",
        audience_reaction: "Shock",
        viral_triggers: "Loud noise",
        open_loop: "Big question",
        transition_out: "Cut to black"
      }
    ],

    hook_technique: "Description",
    retention_tactics: ["Tactic 1", "Tactic 2"],
    audience_psychology: "Description",
    audience_sentiment: {
      high_dopamine_triggers: ["Trigger 1"],
      confusion_points: ["Point 1"],
      objections: ["Objection 1"]
    },
    contrastive_insight: "Insight",
    linguistic_style: "Description",
    successful_patterns: ["Pattern 1"],
    content_gaps: ["Gap 1"],
    viral_triggers: ["Trigger 1"],
    flop_reasons: ["Reason 1"],

    // NEW GLOBAL FIELDS
    target_platform: "YouTube Shorts",
    target_length: "60s",
    target_word_count_range: "3000-3400",  // NEW: Calculate min-max from viral scripts
    overall_vibe: "Description"
  },
  raw_transcript_summary: "Summary"
};

// Constants for batch processing
const BATCH_SIZE = 2; // Process 2 scripts at a time for better accuracy

// Helper: Calculate word count range from scripts - MORE ACCURATE
const calculateWordCountRange = (scripts: ContentPiece[]): string => {
  if (scripts.length === 0) return "1000-2000";

  const wordCounts = scripts.map(s => {
    // More accurate word count - handle Vietnamese and special characters
    const text = s.script.trim();
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    return words;
  });

  const min = Math.min(...wordCounts);
  const max = Math.max(...wordCounts);
  const avg = Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length);

  console.log(`Word counts per script: ${wordCounts.join(', ')}, Average: ${avg}`);

  // Use actual values, only round to nearest 50 for cleaner display
  const roundedMin = Math.floor(min / 50) * 50;
  const roundedMax = Math.ceil(max / 50) * 50;

  return `${roundedMin}-${roundedMax}`;
};

// Helper: Calculate AVERAGE word count (single number for target)
const calculateAverageWordCount = (scripts: ContentPiece[]): number => {
  if (scripts.length === 0) return 1500;
  const wordCounts = scripts.map(s => s.script.trim().split(/\s+/).filter(w => w.length > 0).length);
  return Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length);
};

// AI-Powered Synthesis: Merge multiple DNAs into one refined DNA
const synthesizeDNAs = async (
  dnas: ScriptDNA[],
  targetWordCount: number,
  language: OutputLanguage,
  apiKey: string
): Promise<ScriptDNA> => {
  if (dnas.length === 0) throw new Error("No DNA to synthesize");
  if (dnas.length === 1) {
    dnas[0].analysis.target_word_count_range = `${targetWordCount}`;
    return dnas[0];
  }

  console.log(`Synthesizing ${dnas.length} DNAs with AI... Target: ${targetWordCount} words`);

  // Prepare DNA summaries for AI
  const dnaStrings = dnas.map((dna, i) =>
    `=== DNA #${i + 1} ===\n${JSON.stringify(dna.analysis, null, 2)}`
  ).join('\n\n');

  const synthesisPrompt = `You have ${dnas.length} raw DNA analyses from different viral scripts in the same niche.

${dnaStrings}

YOUR TASK:
Synthesize ALL these DNAs into ONE refined, unified DNA.

CRITICAL RULES:
1. **TARGET WORD COUNT = ${targetWordCount} words** - This is FIXED. Your structure must sum to exactly this.
2. **STRUCTURE**: Create a balanced structure (5-8 sections). Don't just concatenate - SYNTHESIZE the essence.
3. **REFINEMENT**: For each section, combine insights from ALL DNAs into one refined description.
4. **NO BLOAT**: Be concise. Remove redundancy. Keep only what's essential and impactful.
5. Each section's word_count_range should sum to approximately ${targetWordCount} total.

OUTPUT: Return PURE JSON matching the DNA template. Include the refined, synthesized analysis.`;

  const systemPrompt = `${DNA_SYSTEM_PROMPT}
  \nCRITICAL: You are SYNTHESIZING multiple DNAs into ONE refined DNA.
  - Do NOT just merge arrays. SYNTHESIZE and REFINE.
  - Target word count is FIXED at ${targetWordCount} words.
  - Output valid JSON only.
  \nTEMPLATE:\n${JSON.stringify(dnaTemplate, null, 2)}`;

  const responseText = await generateContentViaOpenRouter(
    GEMINI_MODEL,
    systemPrompt,
    synthesisPrompt + getLanguageInstruction(language) + "\n\nOUTPUT PURE JSON ONLY.",
    apiKey,
    true
  );

  // Combine all source URLs from input DNAs
  const allUrls = dnas.flatMap(d => d.source_urls || []);

  const synthesized = parseDnaResponse(responseText, []);
  synthesized.source_urls = [...new Set(allUrls)];
  synthesized.analysis.target_word_count_range = `${targetWordCount}`;
  synthesized.id = `dna-synthesized-${Date.now()}`;

  return synthesized;
};

// Helper: Process a single batch of scripts
const extractSingleBatch = async (
  virals: ContentPiece[],
  flops: ContentPiece[],
  language: OutputLanguage,
  apiKey: string,
  customPrompt?: string
): Promise<ScriptDNA> => {
  const viralsText = formatContentForPrompt(virals, "VIRAL");
  const flopsText = formatContentForPrompt(flops, "FLOP");

  let finalPrompt = customPrompt && customPrompt.trim()
    ? `INPUT DATA STREAMS:\n=== DATASET A: VIRAL HITS ===\n${viralsText}\n=== DATASET B: FLOPS ===\n${flopsText}\nUSER CUSTOM INSTRUCTIONS:\n${customPrompt}\nTASK: Perform analysis and output strictly in JSON.`
    : constructDnaPrompt(viralsText, flopsText);

  finalPrompt += getLanguageInstruction(language);
  finalPrompt += "\n\nREMINDER: OUTPUT PURE JSON ONLY. NO MARKDOWN. START WITH '{'.";

  const systemPrompt = `${DNA_SYSTEM_PROMPT}
  \nCRITICAL OUTPUT RULE: You MUST return valid JSON matching the template below. 
  - Do NOT output schema definitions. 
  - Output the FILLED data object.
  \nTEMPLATE:\n${JSON.stringify(dnaTemplate, null, 2)}`;

  const responseText = await generateContentViaOpenRouter(GEMINI_MODEL, systemPrompt, finalPrompt, apiKey, true);
  return parseDnaResponse(responseText, virals);
};

export const extractScriptDNA = async (
  virals: ContentPiece[],
  flops: ContentPiece[],
  language: OutputLanguage,
  apiKey: string,
  customPrompt?: string,
  modelId?: string,
  onProgress?: (current: number, total: number) => void
): Promise<ScriptDNA> => {

  // Calculate word count range from ALL virals first
  const wordCountRange = calculateWordCountRange(virals);

  console.log("--- DEBUG DNA INPUT ---");
  console.log(`Virals Count: ${virals.length}, Word Count Range: ${wordCountRange}`);
  console.log(`Flops Count: ${flops.length}`);

  // If small batch (2 or less), process directly
  if (virals.length <= BATCH_SIZE) {
    const dna = await extractSingleBatch(virals, flops, language, apiKey, customPrompt);
    dna.analysis.target_word_count_range = wordCountRange;
    return dna;
  }

  // BATCH PROCESSING: Split virals into batches of 2
  const batches: ContentPiece[][] = [];
  for (let i = 0; i < virals.length; i += BATCH_SIZE) {
    batches.push(virals.slice(i, i + BATCH_SIZE));
  }

  console.log(`Processing ${batches.length} batches with staggered delay...`);
  if (onProgress) onProgress(0, batches.length);

  // Helper: Random delay between 2-3 seconds
  const randomDelay = () => new Promise(resolve =>
    setTimeout(resolve, 2000 + Math.random() * 1000)
  );

  // STAGGERED PARALLEL PROCESSING: Add delay between batch starts
  const batchPromises = batches.map(async (batch, i) => {
    // Add delay for all batches except the first one
    if (i > 0) {
      console.log(`Waiting before batch ${i + 1}...`);
      await randomDelay();
    }

    console.log(`Starting batch ${i + 1}/${batches.length}...`);
    if (onProgress) onProgress(i + 1, batches.length);

    // Only include flops in first batch to avoid duplication
    const batchFlops = i === 0 ? flops : [];
    return extractSingleBatch(batch, batchFlops, language, apiKey, customPrompt);
  });

  // Wait for all batches to complete
  const dnaResults = await Promise.all(batchPromises);

  if (onProgress) onProgress(batches.length, batches.length);
  console.log("All batches completed. Synthesizing DNA results with AI...");

  // AI SYNTHESIS: Merge all batch results into one refined DNA
  const targetWordCount = calculateAverageWordCount(virals);
  const synthesizedDna = await synthesizeDNAs(dnaResults, targetWordCount, language, apiKey);

  return synthesizedDna;
};

export const refineScriptDNA = async (
  existingDNA: ScriptDNA,
  newVirals: ContentPiece[],
  newFlops: ContentPiece[],
  language: OutputLanguage,
  apiKey: string,
  customPrompt?: string,
  modelId?: string
): Promise<ScriptDNA> => {

  const viralsText = formatContentForPrompt(newVirals, "NEW VIRAL");
  const flopsText = formatContentForPrompt(newFlops, "NEW FLOP");
  const existingDnaJson = JSON.stringify(existingDNA.analysis, null, 2);

  // DEBUG LOGGING
  console.log("--- DEBUG DNA REFINE INPUT ---");
  console.log(`New Virals Length: ${viralsText.length}`);

  let finalPrompt = customPrompt && customPrompt.trim()
    ? `BASE DNA: ${existingDnaJson}\nNEW VIRALS: ${viralsText}\nNEW FLOPS: ${flopsText}\nUSER INSTRUCTIONS: ${customPrompt}`
    : constructDnaRefinementPrompt(existingDnaJson, viralsText, flopsText);

  finalPrompt += getLanguageInstruction(language);
  finalPrompt += "\n\nREMINDER: OUTPUT PURE JSON ONLY. NO MARKDOWN. START WITH '{'.";

  const systemPrompt = `${DNA_REFINEMENT_SYSTEM_PROMPT}
  \nCRITICAL OUTPUT RULE: You MUST return valid JSON matching the template below.
  - Do NOT output schema definitions. 
  - Output the FILLED data object.
  \nTEMPLATE:\n${JSON.stringify(dnaTemplate, null, 2)}`;

  const responseText = await generateContentViaOpenRouter(GEMINI_MODEL, systemPrompt, finalPrompt, apiKey, true);

  const newDna = parseDnaResponse(responseText, newVirals);
  const allUrls = [...(existingDNA.source_urls || []), ...(newVirals.map(v => v.url || "").filter(Boolean))];

  return {
    ...existingDNA,
    id: existingDNA.id || `dna-evolved-${Date.now()}`,
    name: newDna.name || existingDNA.name,
    source_urls: [...new Set(allUrls)]
  };
};

const formatContentForPrompt = (pieces: ContentPiece[], label: string) => {
  return pieces.map((v, i) => `[${label} #${i + 1}]\nTitle: ${v.title}\nTranscript: ${v.script}\nFeedback: ${v.comments || "N/A"}`).join("\n\n");
}

const parseDnaResponse = (responseText: string, sources: ContentPiece[]): ScriptDNA => {
  let parsed;
  try {
    parsed = JSON.parse(responseText || "{}");
    // Basic unwrapping if needed
    if (parsed.dna) parsed = parsed.dna;
  } catch (e) {
    console.error("DNA Parse Error", responseText);
    throw new Error("Failed to parse AI response.");
  }
  return { id: `dna-${Date.now()}`, source_urls: sources.map(v => v.url || "").filter(Boolean), ...parsed };
}
