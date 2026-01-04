import { callOpenRouter, extractJsonFromResponse, ChatMessage } from "./openrouter";

export interface AnalyzedPersona {
  name: string;
  ageRange: string;
  knowledgeLevel: string;
  painPoints: string[];
  preferredTone: string;
  vocabulary: string;
  platform: string;
  description: string;
  contentPreferences?: string[];
  motivations?: string[];
  objections?: string[];
}

const ANALYZE_PERSONA_PROMPT = `You are an expert audience researcher and psychologist. Your job is to "Reverse Engineer" a target audience persona based on the content they consume (Transcript) and the feedback they provide (Comments).

If provided with a Manual Description, use it as the base.
If provided with Transcript/Comments, deduce the persona from the data:
- Analyze the Transcript to understand the complexity, tone, and subject matter they are interested in.
- Analyze the Comments to identify their *real* pain points, objections, questions, and what resonates with them.
- Look for patterns in the comments: Do they complain about something specific? (Pain Points). Do they ask beginner or advanced questions? (Knowledge Level).

OUTPUT FORMAT:
{
  "name": "Descriptive persona name (e.g., 'Frustrated Beginner Investor', 'Skeptical Bio-Hacker')",
  "ageRange": "e.g., 22-35",
  "knowledgeLevel": "beginner|intermediate|advanced",
  "painPoints": ["specific pain point 1", "specific pain point 2 (derived from complaints)", "specific pain point 3"],
  "preferredTone": "casual|formal|inspirational|educational|humorous|direct|empathetic",
  "vocabulary": "Description of vocabulary style and level",
  "platform": "Primary platform (YouTube, TikTok, Instagram, etc.)",
  "description": "2-3 sentence summary of this persona, focusing on their psychology",
  "contentPreferences": ["what type of content they engage with"],
  "motivations": ["what drives them to watch (deduced from positive comments)"],
  "objections": ["what might prevent them from engaging (deduced from negative/skeptical comments)"]
}`;

export const analyzePersona = async (
  apiKey: string,
  model: string = "google/gemini-3-flash-preview",
  description?: string,
  transcript?: string,
  comments?: string
): Promise<AnalyzedPersona> => {
  if (!apiKey) {
    throw new Error("OpenRouter API Key chưa được cấu hình. Vui lòng nhập key vào Settings.");
  }

  if (!description && !transcript && !comments) {
    throw new Error("Cần có description, transcript hoặc comments để phân tích.");
  }

  let promptContext = "";
  if (description) promptContext += `MANUAL DESCRIPTION:\n${description}\n\n`;
  if (transcript) promptContext += `CONTENT TRANSCRIPT (What they watch):\n${transcript}\n\n`;
  if (comments) promptContext += `COMMUNITY COMMENTS (What they say):\n${comments}\n\n`;

  const userMessage = `Analyze the following data to reverse-engineer the target audience persona:\n\n${promptContext}`;

  const messages: ChatMessage[] = [
    { role: "system", content: ANALYZE_PERSONA_PROMPT },
    { role: "user", content: userMessage }
  ];

  const response = await callOpenRouter(messages, apiKey, model);
  return extractJsonFromResponse(response);
};
