
import { Type, Schema } from "@google/genai";
import { ContentPiece, ScriptDNA, OutputLanguage } from "../../types";
import { GEMINI_MODEL } from "../../constants";
import { DNA_SYSTEM_PROMPT, DNA_REFINEMENT_SYSTEM_PROMPT, constructDnaPrompt, constructDnaRefinementPrompt, getLanguageInstruction } from "./prompts";
import { generateContentViaOpenRouter } from "../openRouterService";

const getDnaSchema = (): Schema => ({
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    analysis: {
      type: Type.OBJECT,
      properties: {
        pacing: { type: Type.STRING },
        tone: { type: Type.STRING },
        structure_skeleton: { type: Type.ARRAY, items: { type: Type.STRING } },
        hook_technique: { type: Type.STRING },
        retention_tactics: { type: Type.ARRAY, items: { type: Type.STRING } },
        audience_psychology: { type: Type.STRING },
        audience_sentiment: {
            type: Type.OBJECT,
            properties: {
                high_dopamine_triggers: { type: Type.ARRAY, items: { type: Type.STRING } },
                confusion_points: { type: Type.ARRAY, items: { type: Type.STRING } },
                objections: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["high_dopamine_triggers", "confusion_points", "objections"]
        },
        contrastive_insight: { type: Type.STRING },
        linguistic_style: { type: Type.STRING },
        successful_patterns: { type: Type.ARRAY, items: { type: Type.STRING } },
        content_gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
        viral_triggers: { type: Type.ARRAY, items: { type: Type.STRING } },
        flop_reasons: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["pacing", "tone", "structure_skeleton", "hook_technique", "audience_psychology", "audience_sentiment", "contrastive_insight", "linguistic_style", "successful_patterns", "viral_triggers", "flop_reasons"]
    },
    raw_transcript_summary: { type: Type.STRING }
  },
  required: ["name", "analysis", "raw_transcript_summary"]
});

export const extractScriptDNA = async (
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

  const systemPrompt = `${DNA_SYSTEM_PROMPT}\nCRITICAL OUTPUT RULE: You MUST return valid JSON matching the schema. SCHEMA:\n${JSON.stringify(getDnaSchema(), null, 2)}`;

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

  let finalPrompt = customPrompt && customPrompt.trim()
      ? `BASE DNA: ${existingDnaJson}\nNEW VIRALS: ${viralsText}\nNEW FLOPS: ${flopsText}\nUSER INSTRUCTIONS: ${customPrompt}`
      : constructDnaRefinementPrompt(existingDnaJson, viralsText, flopsText);

  finalPrompt += getLanguageInstruction(language);

  const systemPrompt = `${DNA_REFINEMENT_SYSTEM_PROMPT}\nCRITICAL OUTPUT RULE: You MUST return valid JSON matching the schema. SCHEMA:\n${JSON.stringify(getDnaSchema(), null, 2)}`;

  const responseText = await generateContentViaOpenRouter(GEMINI_MODEL, systemPrompt, finalPrompt, apiKey, true);

  const newDna = parseDnaResponse(responseText, newVirals);
  const allUrls = [...(parentDNA.source_urls || []), ...(newVirals.map(v => v.url || "").filter(Boolean))];
  
  return { ...newDna, id: parentDNA.id, name: newDna.name || parentDNA.name, source_urls: [...new Set(allUrls)] };
};

const formatContentForPrompt = (pieces: ContentPiece[], label: string) => {
  return pieces.map((v, i) => `[${label} #${i+1}]\nTitle: ${v.title}\nTranscript: ${v.script.substring(0, 8000)}\nFeedback: ${v.comments || "N/A"}`).join("\n\n");
}

const parseDnaResponse = (responseText: string, sources: ContentPiece[]): ScriptDNA => {
  let parsed;
  try { parsed = JSON.parse(responseText || "{}"); } catch (e) { throw new Error("Failed to parse AI response."); }
  return { id: `dna-${Date.now()}`, source_urls: sources.map(v => v.url || "").filter(Boolean), ...parsed };
}
