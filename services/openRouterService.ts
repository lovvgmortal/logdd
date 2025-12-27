
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

  // LOG REQUEST DETAILS
  console.log(`[OpenRouter] Preparing Request...`);
  console.log(`[OpenRouter] Model: ${model}`);
  console.log(`[OpenRouter] System Prompt Length: ${systemInstruction.length}`);
  console.log(`[OpenRouter] User Prompt Length: ${userPrompt.length}`);

  try {
    // Gemini models often fail with strict json_object mode on OpenRouter (returning empty strings)
    // We will rely on prompt engineering for them.
    const isGemini = model.toLowerCase().includes("gemini");

    const body: any = {
      model: model,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userPrompt }
      ],
      // Temperature 0.4 prevents model freeze/looping on empty tokens while keeping it focused
      temperature: 0.4, 
      max_tokens: 32000, 
    };

    if (jsonMode && !isGemini) {
      body.response_format = { type: "json_object" };
    }
    
    console.log(`[OpenRouter] Full Request Payload Size: ~${JSON.stringify(body).length} chars`);

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

    // GET RAW TEXT FIRST & TRIM WHITESPACE
    const rawText = await response.text();
    const responseText = rawText.trim(); 

    // LOG RAW RESPONSE FOR DEBUGGING
    console.log(`[OpenRouter] Response Status: ${response.status}`);
    
    // Log snippet safely
    const logSnippet = responseText.length > 2000 ? responseText.substring(0, 2000) + "..." : responseText;
    console.log(`[OpenRouter] Raw Response:`, logSnippet);

    let data;
    try {
        if (!responseText) {
             throw new Error("Empty response body from OpenRouter.");
        }
        data = JSON.parse(responseText);
    } catch (e) {
        console.error("[OpenRouter] FATAL: API returned invalid JSON envelope.");
        throw new Error(`OpenRouter API response was not valid JSON. Status: ${response.status}. Preview: ${logSnippet}`);
    }

    if (!response.ok) {
      const errorMsg = data.error?.message || data.error?.code || JSON.stringify(data);
      throw new Error(`OpenRouter Error (${response.status}): ${errorMsg}`);
    }

    let content = data.choices?.[0]?.message?.content || "";
    
    // Handle Thinking Models: sometimes content is empty if they are thinking, 
    // but usually OpenRouter maps final output to content.
    if (!content && data.choices?.[0]?.finish_reason === "stop") {
        console.warn("[OpenRouter] Content is empty but finish_reason is stop. Model might have failed to generate text.");
    }

    console.log(`[OpenRouter] Extracted Content Length: ${content.length}`);

    // Smart JSON Extraction
    if (jsonMode) {
        // 1. Clean Markdown
        content = content.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "");
        
        // 2. Locate JSON Object
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
            const extracted = content.substring(firstBrace, lastBrace + 1);
            if (extracted.length < content.length) {
                console.log(`[OpenRouter] Trimmed content from ${content.length} to ${extracted.length} chars (found JSON bounds).`);
                content = extracted;
            }
        } else {
            console.warn("[OpenRouter] JSON Mode is ON but no curly braces found in content!");
        }
    }

    if (!content.trim()) {
         throw new Error("AI returned empty content string.");
    }

    return content;
  } catch (error: any) {
    console.error("OpenRouter Service Error:", error);
    throw new Error(error.message || "Failed to generate content via OpenRouter");
  }
};
