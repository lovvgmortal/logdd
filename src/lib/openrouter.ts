export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const callOpenRouter = async (
  messages: ChatMessage[],
  apiKey: string,
  model: string = "google/gemini-3-flash-preview"
): Promise<string> => {
  if (!apiKey) {
    throw new Error("OpenRouter API Key not configured. Please enter your key in Settings.");
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || `HTTP ${response.status}`;

      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      if (response.status === 401 || response.status === 402) {
        throw new Error("Invalid OpenRouter API Key or out of credits.");
      }
      throw new Error(`OpenRouter error: ${errorMsg}`);
    }

    const data: OpenRouterResponse = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response received from AI");
    }

    return content;
  } catch (error: any) {
    console.error("OpenRouter Error:", error);
    throw new Error(error.message || "Could not connect to OpenRouter");
  }
};

// Helper to extract JSON from AI response
// Helper to extract JSON from AI response
export const extractJsonFromResponse = (response: string): any => {
  // 1. Try cleaning markdown code blocks
  let cleanResponse = response.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");

  try {
    return JSON.parse(cleanResponse);
  } catch (e) {
    // 2. If simple parse fails, try regex for Array or Object
    const jsonMatch = cleanResponse.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (!jsonMatch) {
      console.error("Failed to extract JSON from:", response);
      throw new Error("Could not parse JSON from response");
    }
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (innerError) {
      console.error("JSON Parse Error:", innerError, "Extracted:", jsonMatch[0]);
      throw new Error("Extracted text was not valid JSON");
    }
  }
};