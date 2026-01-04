
import { Type, Schema } from "@google/genai";
import { ContentPiece, ScriptBlueprint, BlueprintSection, OutputLanguage, OptimizedResult, ScriptNode, ChannelProfile } from "../../types";
import { GEMINI_MODEL } from "../../constants";
import { WRITER_SYSTEM_PROMPT, constructSectionPrompt, REFINEMENT_PROMPT, getLanguageInstruction, constructFlowNodePrompt, FLOW_NODE_SYSTEM_PROMPT } from "./prompts";
import { generateContentViaOpenRouter } from "../openRouterService";

export const generateSectionScript = async (
  section: BlueprintSection,
  blueprint: ScriptBlueprint,
  draft: ContentPiece,
  language: OutputLanguage,
  apiKey: string,
  globalPrompt?: string,
  modelId?: string
): Promise<string> => {
  const targetModel = modelId || GEMINI_MODEL;
  const sectionDetails = `Section: ${section.title}\nGoal: ${section.purpose}\nPlan: ${section.content_plan}`;
  const customInstruction = section.custom_script_prompt ? `OVERRIDE: "${section.custom_script_prompt}"` : "";
  // Global prompt contains context/previous content
  const previousContent = globalPrompt || "Start of video";

  const systemPrompt = WRITER_SYSTEM_PROMPT;
  const globalStyle = `DNA CONTEXT: Tone: ${blueprint.analysis.linguistic_fingerprint.dominant_tones.join(', ')}`;

  const userPrompt = `${getLanguageInstruction(language)}\n${constructSectionPrompt(
    sectionDetails + (customInstruction ? `\n${customInstruction}` : ""),
    globalStyle,
    previousContent,
    "", // REMOVED: No longer send draft content to prevent repetition
    section.dna_section_detail
  )}`;

  return await generateContentViaOpenRouter(targetModel, systemPrompt, userPrompt, apiKey);
};

export const generateScriptFromBlueprint = async (
  blueprint: ScriptBlueprint,
  draft: ContentPiece,
  language: OutputLanguage,
  apiKey: string,
  globalPrompt?: string,
  modelId?: string
): Promise<OptimizedResult> => {
  const targetModel = modelId || GEMINI_MODEL;

  const metaSchema: Schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, tags: { type: Type.STRING } }, required: ["title", "description", "tags"] };
  const metaResponseText = await generateContentViaOpenRouter(targetModel, `Return valid JSON matching schema: ${JSON.stringify(metaSchema)}`, `Generate metadata. Analysis: ${JSON.stringify(blueprint.analysis)} ${getLanguageInstruction(language)}`, apiKey, true);
  const meta = JSON.parse(metaResponseText || "{}");

  let updatedSections = [...blueprint.sections];
  for (let i = 0; i < updatedSections.length; i++) {
    const section = updatedSections[i];
    const prevContent = i > 0 ? updatedSections[i - 1].generated_content : "";
    const combinedGlobalPrompt = `${globalPrompt || ""} \n PREVIOUS END: "...${prevContent?.slice(-1500) || ''}"`;

    const content = await generateSectionScript(section, blueprint, draft, language, apiKey, combinedGlobalPrompt, targetModel);
    updatedSections[i] = { ...section, generated_content: content };
  }

  return {
    blueprint,
    rewritten: {
      title: meta.title || "Optimized Title",
      description: meta.description || "Viral Description",
      tags: meta.tags || "trending",
      explanation_of_changes: "Optimized based on DNA.",
      script_sections: updatedSections.map(s => ({ id: s.id, title: s.title, type: s.type, content: s.generated_content || "" }))
    }
  };
};

export const refineSection = async (section: any, instruction: string, context: string, lang: OutputLanguage, apiKey: string, modelId?: string) => {
  const targetModel = modelId || GEMINI_MODEL;
  const systemPrompt = `Expert script editor.Refine content.`;
  const userPrompt = `CONTEXT: ${context} \nORIGINAL: "${section.content}"\nINSTRUCTION: ${instruction} \nOUTPUT: Rewritten text in ${lang}.`;
  return await generateContentViaOpenRouter(targetModel, systemPrompt, userPrompt, apiKey);
};

export const generateNodeContent = async (
  node: ScriptNode,
  nodes: ScriptNode[],
  topic: string,
  profile?: ChannelProfile
): Promise<string> => {
  const currentIndex = nodes.findIndex(n => n.id === node.id);
  const prevNode = currentIndex > 0 ? nodes[currentIndex - 1] : null;
  const contextSoFar = prevNode ? prevNode.content : "Start of Video";

  const channelContext = profile ? `${profile.name} (Voice: ${profile.voice})` : "Standard Creator";

  const prompt = constructFlowNodePrompt(node, topic, channelContext, contextSoFar);

  // See note in generateScriptStructure about API Key
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY || '' : '';
  const storedSettings = typeof localStorage !== 'undefined' ? localStorage.getItem('user_settings') : null;
  const keyToUse = apiKey || (storedSettings ? JSON.parse(storedSettings).openrouter_key : '');

  return await generateContentViaOpenRouter(
    GEMINI_MODEL,
    FLOW_NODE_SYSTEM_PROMPT,
    prompt,
    keyToUse
  );
};
