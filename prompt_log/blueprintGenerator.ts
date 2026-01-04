
import { Type, Schema } from "@google/genai";
import { ContentPiece, ScriptBlueprint, ScriptDNA, OutputLanguage, CreationMode, ScriptNode, ChannelProfile, ScoringTemplate } from "../../types";
import { GEMINI_MODEL } from "../../constants";
import { BLUEPRINT_SYSTEM_PROMPT, FLOW_STRUCTURE_SYSTEM_PROMPT, constructBlueprintPrompt, constructFlowStructurePrompt, getLanguageInstruction } from "./prompts";
import { generateContentViaOpenRouter } from "../openRouterService";

// Helper to sanitize text: removes control characters that break JSON
const sanitizeText = (text: string) => {
  if (!text) return "";
  // Remove control characters (ASCII 0-31) except newline (10) and tab (9)
  return text.replace(/[\x00-\x08\x0B-\x1F\x7F]/g, "");
};

// Robust JSON Repair
const repairJSON = (jsonStr: string): string => {
  if (!jsonStr) return "{}";
  let cleaned = jsonStr.trim();

  // 1. Remove Markdown code blocks
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "");

  // 2. Find valid JSON envelope
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // 3. Fix common trailing commas (e.g. "key": "value", })
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  return cleaned;
};

// Unwraps "type": "object" style responses if AI hallucinates the schema wrapper
const unwrapHallucinatedSchema = (parsed: any): any => {
  if (!parsed) return parsed;

  // Check if it's wrapped in "properties" (Schema definition style)
  if (parsed.properties && !parsed.sections && !parsed.analysis) {
    console.warn("Unwrapping hallucinated schema structure (Level 1)...");
    // Try to construct a clean object from the 'properties' values
    // Note: Usually the AI puts the actual data in 'properties' keys if it hallucinates, 
    // OR it puts strict schema defs. If strictly defs, we are screwed, but often it puts data there.
    // Let's check for 'analysis' inside properties
    if (parsed.properties.analysis) {
      // If analysis is also wrapped
      if (parsed.properties.analysis.properties) {
        console.warn("Deep unwrap required. Aborting unwrap, data likely invalid schema definition.");
        return parsed; // Likely just a schema definition, not data.
      }
      // It might be data directly
      return parsed.properties;
    }
  }

  // Sometimes it wraps in a root object like { "blueprint": { ... } }
  if (parsed.blueprint && parsed.blueprint.sections) {
    return parsed.blueprint;
  }

  return parsed;
};

export const generateScriptBlueprint = async (
  mode: CreationMode | null,
  language: OutputLanguage,
  draft: ContentPiece,
  virals: ContentPiece[],
  flops: ContentPiece[],
  targetWordCount: number,
  apiKey: string,
  customStructurePrompt?: string,
  selectedDNA?: ScriptDNA,
  scoringCriteria?: ScoringTemplate // NEW PARAMETER
): Promise<ScriptBlueprint> => {

  let constraints = "Optimize for retention.";

  if (selectedDNA) {
    constraints = `STYLE & STRUCTURE GUIDE (FROM DNA: ${selectedDNA.name}):\n`;
    constraints += `- Tone: ${selectedDNA.analysis.tone}\n`;
    constraints += `- Structure: ${JSON.stringify(selectedDNA.analysis.structure_skeleton)}\n`;
    constraints += `- Viral Triggers to use: ${JSON.stringify(selectedDNA.analysis.viral_triggers)}\n`;

    if (selectedDNA.user_notes) {
      constraints += `\nUSER MANDATORY NOTES / CONSTRAINTS: "${sanitizeText(selectedDNA.user_notes)}"\n`;
    }
  }

  // NEW: Inject Scoring Criteria as Hard Constraints
  if (scoringCriteria && scoringCriteria.criteria.length > 0) {
    constraints += `\n\nCRITICAL QUALITY STANDARDS (You MUST follow these rules):`;
    scoringCriteria.criteria.forEach((c, idx) => {
      constraints += `\n${idx + 1}. ${c.name}: ${c.description}`;
    });
    constraints += `\nEnsure the generated blueprint explicitly addresses these standards.`;
  }

  // --- 1. BUILD DRAFT CONTEXT (XML TAGS FOR SAFETY) ---
  const draftContent = sanitizeText(draft.script || draft.description || "");
  let promptContext = "";

  if (mode === 'idea') {
    promptContext = `PRIMARY USER PROMPT / IDEA: Title: "${sanitizeText(draft.title)}"\n<idea_concept>\n${draftContent}\n</idea_concept>\nTASK: Generate blueprint from this idea.`;
  } else {
    promptContext = `SOURCE MATERIAL (DRAFT TO REWRITE):\n<source_material>\n${draftContent}\n</source_material>\n\nTASK: Restructure this material completely.`;
  }

  // --- 2. BUILD VIRAL CONTEXT ---
  if (virals && virals.length > 0) {
    const viralString = virals.map((v, i) =>
      `[VIRAL REF #${i + 1}]\nTitle: ${sanitizeText(v.title)}\n<content>\n${sanitizeText(v.script || v.description)}\n</content>\nFeedback: ${sanitizeText(v.comments || "N/A")}`
    ).join("\n\n");
    promptContext += `\n\n=== VIRAL REFERENCES (EMULATE THESE PATTERNS) ===\n${viralString}`;
  } else {
    promptContext += `\n\n=== VIRAL REFERENCES ===\n(None provided. Rely on General Viral Logic.)`;
  }

  // --- 3. BUILD FLOP CONTEXT ---
  if (flops && flops.length > 0) {
    const flopString = flops.map((v, i) =>
      `[FLOP REF #${i + 1}]\nTitle: ${sanitizeText(v.title)}\n<content>\n${sanitizeText(v.script || v.description)}\n</content>\nFeedback: ${sanitizeText(v.comments || "N/A")}`
    ).join("\n\n");
    promptContext += `\n\n=== FLOP REFERENCES (AVOID THESE PATTERNS) ===\n${flopString}`;
  } else {
    promptContext += `\n\n=== FLOP REFERENCES ===\n(None provided. Rely on General Flop Avoidance Logic.)`;
  }

  // DEBUG LOGGING
  console.log("--- DEBUG BLUEPRINT INPUT ---");
  console.log(`Mode: ${mode}`);
  console.log(`Draft Length: ${draftContent.length}`);

  if (customStructurePrompt && customStructurePrompt.trim()) {
    constraints += `\n\nUSER OVERRIDE: ${sanitizeText(customStructurePrompt)}`;
  }

  const prompt = constructBlueprintPrompt(promptContext, constraints, targetWordCount) + getLanguageInstruction(language);

  // SIMPLIFIED TEMPLATE to avoid Schema Hallucination
  const jsonTemplate = {
    analysis: {
      core_formula: "The concise formula name",
      narrative_phases: [{ phase: "Setup", purpose: "Hook", duration_weight: "10%" }],
      pacing_map: { climax_points: ["Midpoint", "End"], speed_strategy: "Fast start, slow middle", pattern: "Linear" },
      hook_hierarchy: { main_hook: "The big promise", micro_hooks: ["Visual", "Audio"], psychological_anchor: "Curiosity" },
      emotional_arc: { triggers: ["Fear", "Relief"], energy_flow: "Rising", payoff_moment: "The reveal" },
      linguistic_fingerprint: { pov: "First person", dominant_tones: ["Authoritative"], vocabulary_style: "Simple" }
    },
    audience_simulation: {
      newbie_perspective: "Reaction...",
      expert_perspective: "Reaction...",
      hater_critique: "Reaction...",
      final_verdict: "Go / No Go"
    },
    pitfalls: ["Avoid X", "Don't do Y"],
    critique: "Overall assessment...",
    sections: [
      {
        title: "Section Title",
        type: "Hook / Body / CTA",
        purpose: "Goal of section",
        hook_tactic: "Technique used",
        emotional_goal: "Feeling",
        pacing_instruction: "Fast/Slow",
        content_plan: "Detailed outline...",
        word_count_target: 150
      }
    ]
  };

  const systemPrompt = `${BLUEPRINT_SYSTEM_PROMPT}
  \nCRITICAL OUTPUT RULE: Return ONLY a valid JSON object. 
  - Follow the structure below exactly.
  - Do NOT output schema definitions (like "type": "object"). 
  - Just fill the data.
  
  REQUIRED JSON STRUCTURE:
  ${JSON.stringify(jsonTemplate, null, 2)}`;

  const finalPrompt = prompt + "\n\nREMINDER: OUTPUT PURE JSON ONLY. START WITH '{'. NO MARKDOWN. NO REASONING TEXT.";

  const responseText = await generateContentViaOpenRouter(GEMINI_MODEL, systemPrompt, finalPrompt, apiKey, true);

  let parsed;
  try {
    parsed = JSON.parse(responseText);
    parsed = unwrapHallucinatedSchema(parsed);
  } catch (e) {
    console.warn("Initial JSON parse failed, attempting repair...");
    try {
      const repaired = repairJSON(responseText);
      parsed = JSON.parse(repaired);
      parsed = unwrapHallucinatedSchema(parsed);
    } catch (finalError) {
      console.error("Blueprint JSON Parse Error. Raw:", responseText);
      throw new Error("Failed to parse blueprint JSON. Check console for raw AI output.");
    }
  }

  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    console.error("Invalid Blueprint Structure:", parsed);
    throw new Error("AI returned JSON, but it is missing the 'sections' array. The generation failed to follow the template.");
  }

  // Ensure sections have unique IDs
  parsed.sections = (parsed.sections || []).map((s: any, i: number) => {
    const section = { ...s, id: `bp-${Date.now()}-${i}` };

    // NEW: Map DNA Metadata to Blueprint Section (Phase 1 Upgrade)
    if (selectedDNA && selectedDNA.analysis.structure_skeleton) {
      const skeleton = selectedDNA.analysis.structure_skeleton;
      // Verify index exists and is not legacy string format
      if (Array.isArray(skeleton) && skeleton.length > i) {
        const dnaItem = skeleton[i];
        if (typeof dnaItem !== 'string') {
          section.dna_section_detail = dnaItem;
        }
      }
    }
    return section;
  });
  return parsed as ScriptBlueprint;
};

export const generateScriptStructure = async (
  topic: string,
  virals: ContentPiece[],
  profile?: ChannelProfile
): Promise<ScriptNode[]> => {
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY || '' : '';
  const viralContext = virals.map(v => `${v.title}: ${sanitizeText(v.description)}`).join('\n');
  const channelContext = profile ? `${profile.name} (${profile.niche}) - Audience: ${profile.audience}` : "General Content Creator";
  const prompt = constructFlowStructurePrompt(topic, viralContext, channelContext);

  const systemPrompt = `${FLOW_STRUCTURE_SYSTEM_PROMPT}\nCRITICAL OUTPUT RULE: Return valid JSON. No Markdown.`;
  const storedSettings = typeof localStorage !== 'undefined' ? localStorage.getItem('user_settings') : null;
  const keyToUse = apiKey || (storedSettings ? JSON.parse(storedSettings).openrouter_key : '');

  const responseText = await generateContentViaOpenRouter(
    GEMINI_MODEL,
    systemPrompt,
    prompt,
    keyToUse,
    true
  );

  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch (e) {
    try {
      parsed = JSON.parse(repairJSON(responseText));
    } catch (finalError) {
      console.error("Structure JSON Parse Error", responseText);
      parsed = { nodes: [] };
    }
  }

  return (parsed.nodes || []).map((n: any, i: number) => ({
    ...n,
    id: `node-${Date.now()}-${i}`,
    content: ''
  }));
};
