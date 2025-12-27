
import { Type, Schema } from "@google/genai";
import { ContentPiece, ScriptDNA, OutputLanguage } from "../../types";
import { GEMINI_MODEL } from "../../constants";
import { DNA_SYSTEM_PROMPT, DNA_REFINEMENT_SYSTEM_PROMPT, constructDnaPrompt, constructDnaRefinementPrompt, getLanguageInstruction } from "./prompts";
import { generateContentViaOpenRouter } from "../openRouterService";

// Simplified Template for DNA to prevent Schema Hallucination
const dnaTemplate = {
    name: "Pattern Name",
    analysis: {
        pacing: "Description",
        tone: "Description",
        structure_skeleton: ["Hook", "Intro", "Body", "Payoff"],
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
        flop_reasons: ["Reason 1"]
    },
    raw_transcript_summary: "Summary"
};

export const extractScriptDNA = async (
  virals: ContentPiece[],
  flops: ContentPiece[],
  language: OutputLanguage,
  apiKey: string,
  customPrompt?: string
): Promise<ScriptDNA> => {
  
  const viralsText = formatContentForPrompt(virals, "VIRAL");
  const flopsText = formatContentForPrompt(flops, "FLOP");

  // DEBUG LOGGING
  console.log("--- DEBUG DNA INPUT ---");
  console.log(`Virals Count: ${virals.length}, Total Char Length: ${viralsText.length}`);
  console.log(`Flops Count: ${flops.length}, Total Char Length: ${flopsText.length}`);
  if (viralsText.length < 500) console.warn("WARNING: Viral content is suspiciously short!");

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

export const refineScriptDNA = async (
  parentDNA: ScriptDNA,
  newVirals: ContentPiece[],
  newFlops: ContentPiece[],
  language: OutputLanguage,
  apiKey: string,
  customPrompt?: string
): Promise<ScriptDNA> => {

  const viralsText = formatContentForPrompt(newVirals, "NEW VIRAL");
  const flopsText = formatContentForPrompt(newFlops, "NEW FLOP");
  const existingDnaJson = JSON.stringify(parentDNA.analysis, null, 2);

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
  const allUrls = [...(parentDNA.source_urls || []), ...(newVirals.map(v => v.url || "").filter(Boolean))];
  
  return { ...newDna, id: parentDNA.id, name: newDna.name || parentDNA.name, source_urls: [...new Set(allUrls)] };
};

const formatContentForPrompt = (pieces: ContentPiece[], label: string) => {
  return pieces.map((v, i) => `[${label} #${i+1}]\nTitle: ${v.title}\nTranscript: ${v.script}\nFeedback: ${v.comments || "N/A"}`).join("\n\n");
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
