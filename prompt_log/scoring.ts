
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
  let sourceInfo = "";

  if (mode === 'dna') {
    if (!dna) throw new Error("No DNA provided.");
    criteriaContext = `COMPARE AGAINST DNA:\nTone: ${dna.analysis.tone}\nPacing: ${dna.analysis.pacing}`;

    // Phase 1 Upgrade: Add Structure Details if available
    if (dna.analysis.structure_skeleton && dna.analysis.structure_skeleton.length > 0) {
      const skeleton = dna.analysis.structure_skeleton;
      // Check for new object format (DNASectionDetail)
      if (typeof skeleton[0] !== 'string') {
        const details = (skeleton as any[]).map((s, i) =>
          `Section ${i + 1} (${s.section_name}): Tone='${s.tone || 'N/A'}', Pacing='${s.pacing || 'N/A'}', Focus='${s.content_focus || 'N/A'}'`
        ).join('\n');
        criteriaContext += `\n\nSTRUCTURE REQUIREMENTS:\n${details}`;
      } else {
        // Legacy string format
        criteriaContext += `\n\nSTRUCTURE SKELETON: ${skeleton.join(', ')}`;
      }
    }

    sourceInfo = `DNA: ${dna.name}`;
  } else {
    if (!customTemplate) throw new Error("No criteria provided.");
    criteriaContext = `EVALUATE AGAINST:\n${customTemplate.criteria.map((c, i) => `${i + 1}. ${c.name}: ${c.description}`).join('\n')}`;
    sourceInfo = `Rule: ${customTemplate.name}`;
  }

  const prompt = constructScoringPrompt(fullScript, criteriaContext) + getLanguageInstruction(language);

  // Define expected response structure
  const responseSchema = {
    total_score: "number (0-100)",
    breakdown: [
      {
        criteria: "string (name of criterion)",
        score: "number (0-100)",
        reasoning: "string (why this score)",
        improvement_tip: "string (actionable advice)"
      }
    ],
    overall_feedback: "string (overall verdict)"
  };

  const systemPrompt = `${SCORING_SYSTEM_PROMPT}

CRITICAL: You MUST respond with ONLY valid JSON matching this exact structure:
${JSON.stringify(responseSchema, null, 2)}

DO NOT include any text before or after the JSON.
DO NOT return the schema itself - return ACTUAL DATA with real scores and feedback.
All score values must be numbers between 0-100.`;

  const responseText = await generateContentViaOpenRouter(GEMINI_MODEL, systemPrompt, prompt, apiKey, true);

  console.log('[SCORING API] Raw response text:', responseText.substring(0, 500));

  const parsed = JSON.parse(responseText || "{}");

  console.log('[SCORING API] Parsed result:', parsed);
  console.log('[SCORING API] total_score type:', typeof parsed.total_score, 'value:', parsed.total_score);

  if (typeof parsed.total_score !== 'number') {
    console.error('[SCORING API] ERROR: total_score is not a number!', parsed);
    throw new Error('AI returned invalid score format - total_score must be a number');
  }

  return { ...parsed, timestamp: Date.now(), source_info: sourceInfo };
};
