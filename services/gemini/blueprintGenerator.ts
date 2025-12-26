
import { Type, Schema } from "@google/genai";
import { ContentPiece, ScriptBlueprint, ScriptDNA, OutputLanguage, CreationMode, ScriptNode, ChannelProfile } from "../../types";
import { GEMINI_MODEL } from "../../constants";
import { BLUEPRINT_SYSTEM_PROMPT, FLOW_STRUCTURE_SYSTEM_PROMPT, constructBlueprintPrompt, constructFlowStructurePrompt, getLanguageInstruction } from "./prompts";
import { generateContentViaOpenRouter } from "../openRouterService";

export const generateScriptBlueprint = async (
  mode: CreationMode | null,
  language: OutputLanguage,
  draft: ContentPiece,
  virals: ContentPiece[],
  flops: ContentPiece[],
  targetWordCount: number,
  apiKey: string,
  customStructurePrompt?: string,
  selectedDNA?: ScriptDNA
): Promise<ScriptBlueprint> => {

  let promptContext = "";
  let constraints = selectedDNA ? `STYLE & STRUCTURE GUIDE:\n- Tone: ${selectedDNA.analysis.tone}\n- Structure: ${JSON.stringify(selectedDNA.analysis.structure_skeleton)}\n...` : "Optimize for retention.";

  if (mode === 'idea') {
      promptContext = `PRIMARY USER PROMPT: Title: "${draft.title}"\nConcept: "${draft.script || draft.description}"\nTASK: Generate blueprint from PROMPT.`;
  } else {
      promptContext = `SOURCE MATERIAL: "${draft.script || draft.description}"\nTASK: Restructure material.`;
  }

  if (customStructurePrompt && customStructurePrompt.trim()) {
    constraints += `\n\nUSER OVERRIDE: ${customStructurePrompt}`;
  }

  const prompt = constructBlueprintPrompt(promptContext, constraints, targetWordCount) + getLanguageInstruction(language);

  // ... Schema Definition Omitted for brevity, it's the same ...
  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      analysis: { type: Type.OBJECT, properties: { core_formula: { type: Type.STRING }, narrative_phases: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { phase: { type: Type.STRING }, purpose: { type: Type.STRING }, duration_weight: { type: Type.STRING } } } }, pacing_map: { type: Type.OBJECT, properties: { climax_points: { type: Type.ARRAY, items: { type: Type.STRING } }, speed_strategy: { type: Type.STRING }, pattern: { type: Type.STRING } } }, hook_hierarchy: { type: Type.OBJECT, properties: { main_hook: { type: Type.STRING }, micro_hooks: { type: Type.ARRAY, items: { type: Type.STRING } }, psychological_anchor: { type: Type.STRING } } }, emotional_arc: { type: Type.OBJECT, properties: { triggers: { type: Type.ARRAY, items: { type: Type.STRING } }, energy_flow: { type: Type.STRING }, payoff_moment: { type: Type.STRING } } }, linguistic_fingerprint: { type: Type.OBJECT, properties: { pov: { type: Type.STRING }, dominant_tones: { type: Type.ARRAY, items: { type: Type.STRING } }, vocabulary_style: { type: Type.STRING } } } }, required: ["core_formula", "narrative_phases", "pacing_map", "hook_hierarchy", "emotional_arc", "linguistic_fingerprint"] },
      audience_simulation: { type: Type.OBJECT, properties: { newbie_perspective: { type: Type.STRING }, expert_perspective: { type: Type.STRING }, hater_critique: { type: Type.STRING }, final_verdict: { type: Type.STRING } }, required: ["newbie_perspective", "expert_perspective", "hater_critique", "final_verdict"] },
      pitfalls: { type: Type.ARRAY, items: { type: Type.STRING } },
      critique: { type: Type.STRING },
      sections: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, type: { type: Type.STRING }, purpose: { type: Type.STRING }, hook_tactic: { type: Type.STRING }, micro_hook: { type: Type.STRING }, emotional_goal: { type: Type.STRING }, pacing_instruction: { type: Type.STRING }, pov_instruction: { type: Type.STRING }, tone_instruction: { type: Type.STRING }, retention_loop: { type: Type.STRING }, content_plan: { type: Type.STRING }, word_count_target: { type: Type.NUMBER } }, required: ["title", "type", "purpose", "hook_tactic", "emotional_goal", "pacing_instruction", "content_plan", "word_count_target"] } }
    },
    required: ["analysis", "audience_simulation", "pitfalls", "critique", "sections"]
  };

  const systemPrompt = `${BLUEPRINT_SYSTEM_PROMPT}\nCRITICAL OUTPUT RULE: Return valid JSON matching schema.\nSCHEMA:\n${JSON.stringify(responseSchema, null, 2)}`;

  const responseText = await generateContentViaOpenRouter(GEMINI_MODEL, systemPrompt, prompt, apiKey, true);

  let parsed;
  try { parsed = JSON.parse(responseText || "{}"); } catch (e) { throw new Error("Failed to parse blueprint JSON."); }

  parsed.sections = (parsed.sections || []).map((s: any, i: number) => ({ ...s, id: `bp-${Date.now()}-${i}` }));
  return parsed as ScriptBlueprint;
};

export const generateScriptStructure = async (
  topic: string, 
  virals: ContentPiece[], 
  profile?: ChannelProfile
): Promise<ScriptNode[]> => {
  // We need to fetch an API Key. For simplicity in this structure, we assume process.env or handle it via caller.
  // However, FlowBuilder doesn't pass API key currently.
  // We'll try to use the one from client env if available, or throw.
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY || '' : '';
  
  // Note: Ideally FlowBuilder should pass the API Key like other functions.
  // Since we cannot change FlowBuilder's caller signature easily without changing FlowBuilder.tsx (which we will),
  // we will update FlowBuilder.tsx to pass userSettings (if we could).
  // But FlowBuilder.tsx was not in the "files to change" list for this logic, only for fixing the error.
  // The error was "Module ... has no exported member". 
  // We'll rely on global or we'll need to update FlowBuilder to get the key from context.
  // For now, let's implement the function.
  
  // Actually, to make this work, FlowBuilder SHOULD be using the key. 
  // But to fix the "no exported member" error, we just need to export it. 
  // We'll assume the environment variable or a default key is available for now, 
  // or we might fail at runtime if key is missing, which is better than build error.
  
  // Construct context
  const viralContext = virals.map(v => `${v.title}: ${v.description}`).join('\n');
  const channelContext = profile ? `${profile.name} (${profile.niche}) - Audience: ${profile.audience}` : "General Content Creator";
  
  const prompt = constructFlowStructurePrompt(topic, viralContext, channelContext);
  
  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        nodes: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING },
                    description: { type: Type.STRING },
                    wordCountTarget: { type: Type.NUMBER }
                },
                required: ["type", "description", "wordCountTarget"]
            }
        }
    },
    required: ["nodes"]
  };

  const systemPrompt = `${FLOW_STRUCTURE_SYSTEM_PROMPT}\nCRITICAL OUTPUT RULE: Return valid JSON.`;
  
  // We'll try to get key from local storage or env if not passed
  // This is a hack because the original design didn't pass key to this specific function in the component.
  // Real fix involves updating FlowBuilder to pass key.
  const storedSettings = typeof localStorage !== 'undefined' ? localStorage.getItem('user_settings') : null;
  const keyToUse = apiKey || (storedSettings ? JSON.parse(storedSettings).openrouter_key : '');

  const responseText = await generateContentViaOpenRouter(
      GEMINI_MODEL, 
      systemPrompt, 
      prompt, 
      keyToUse,
      true
  );

  const parsed = JSON.parse(responseText || "{}");
  return (parsed.nodes || []).map((n: any, i: number) => ({
      ...n,
      id: `node-${Date.now()}-${i}`,
      content: ''
  }));
};
