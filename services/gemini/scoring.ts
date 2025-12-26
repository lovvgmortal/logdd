
import { Type, Schema } from "@google/genai";
import { ScriptDNA, ScoringTemplate, ScoringResult, OutputLanguage } from "../../types";
import { GEMINI_MODEL } from "../../constants";
import { SCORING_SYSTEM_PROMPT, constructScoringPrompt, getLanguageInstruction } from "./prompts";
import { generateContentViaOpenRouter } from "../openRouterService";

export const analyzeScriptScore = async (
  fullScript: string,
  mode: 'dna' | 'custom',
  language: OutputLanguage,
  apiKey: string,
  dna?: ScriptDNA,
  customTemplate?: ScoringTemplate
): Promise<ScoringResult> => {

  let criteriaContext = "";
  if (mode === 'dna') {
    if (!dna) throw new Error("No DNA provided.");
    criteriaContext = `COMPARE AGAINST DNA:\nTone: ${dna.analysis.tone}\nPacing: ${dna.analysis.pacing}`;
  } else {
    if (!customTemplate) throw new Error("No criteria provided.");
    criteriaContext = `EVALUATE AGAINST:\n${customTemplate.criteria.map((c, i) => `${i+1}. ${c.name}: ${c.description}`).join('\n')}`;
  }

  const prompt = constructScoringPrompt(fullScript, criteriaContext) + getLanguageInstruction(language);
  const responseSchema: Schema = {
    type: Type.OBJECT, 
    properties: { total_score: { type: Type.NUMBER }, breakdown: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { criteria: { type: Type.STRING }, score: { type: Type.NUMBER }, reasoning: { type: Type.STRING }, improvement_tip: { type: Type.STRING } } } }, overall_feedback: { type: Type.STRING } },
    required: ["total_score", "breakdown", "overall_feedback"]
  };
  const systemPrompt = `${SCORING_SYSTEM_PROMPT}\nOUTPUT RULE: Valid JSON schema.\nSCHEMA:\n${JSON.stringify(responseSchema, null, 2)}`;

  const responseText = await generateContentViaOpenRouter(GEMINI_MODEL, systemPrompt, prompt, apiKey, true);
  const parsed = JSON.parse(responseText || "{}");
  return { ...parsed, timestamp: Date.now() };
};
