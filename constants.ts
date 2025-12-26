
export const GEMINI_MODEL = 'google/gemini-3-pro-preview';

export const AI_MODELS = [
  { id: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro', provider: 'Google' },
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash', provider: 'Google' },
  { id: 'openai/gpt-5.2', name: 'GPT-5.2', provider: 'OpenAI' },
  { id: 'x-ai/grok-4.1-fast', name: 'Grok 4.1 Fast', provider: 'xAI' },
  { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5', provider: 'Anthropic' },
];

export const PLACEHOLDERS = {
  title: "e.g., How I built a SaaS in 2 days",
  description: "e.g., A quick breakdown of the tech stack...",
  script: "e.g., Intro: Start with a hook about time management..."
};
