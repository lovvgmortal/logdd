
import { CreditUsage } from "../types";

export const fetchOpenRouterCredits = async (apiKey?: string): Promise<CreditUsage | null> => {
  if (!apiKey) return null;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.data as CreditUsage;
  } catch (error) {
    console.error("Failed to fetch OpenRouter credits:", error);
    return null;
  }
};

export const generateContentViaOpenRouter = async (
  model: string,
  systemInstruction: string,
  userPrompt: string,
  apiKey?: string,
  jsonMode: boolean = false
): Promise<string> => {
  if (!apiKey) {
    throw new Error("OpenRouter API Key is missing. Please add it in Settings.");
  }

  try {
    const body: any = {
      model: model,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 8000,
    };

    if (jsonMode) {
      body.response_format = { type: "json_object" };
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://log-ai.app", 
        "X-Title": "LOG AI Script Engine", 
      },
      body: JSON.stringify(body)
    });

    const responseText = await response.text();
    let data;

    try {
        data = JSON.parse(responseText);
    } catch (e) {
        throw new Error(`OpenRouter API response was not valid JSON. Status: ${response.status}. Body preview: ${responseText.slice(0, 200)}...`);
    }

    if (!response.ok) {
      throw new Error(`OpenRouter Error: ${data.error?.message || response.statusText || JSON.stringify(data)}`);
    }

    let content = data.choices?.[0]?.message?.content || "";

    if (jsonMode) {
        content = content.replace(/```json\n?|```/g, "").trim();
    }

    return content;
  } catch (error: any) {
    console.error("OpenRouter Generation Error:", error);
    throw new Error(error.message || "Failed to generate content via OpenRouter");
  }
};
