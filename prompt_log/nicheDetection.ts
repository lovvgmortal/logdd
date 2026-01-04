
import { ContentPiece } from "../../types";
import { generateContentViaOpenRouter } from "../openRouterService";
import { GEMINI_MODEL } from "../../constants";

export interface NicheAnalysisResult {
    scriptIndex: number;
    niche: string;
    tone: string;
}

export const detectScriptNiches = async (
    scripts: ContentPiece[],
    apiKey: string,
    modelId?: string
): Promise<NicheAnalysisResult[]> => {
    const targetModel = modelId || GEMINI_MODEL;

    // Construct a prompt to analyze all scripts at once
    const scriptsContext = scripts.map((s, i) => `
SCRIPT #${i + 1}:
Title: ${s.title || "Untitled"}
Content: 
${s.script.slice(0, 5000)}... (Truncated for analysis)
`).join("\n\n----------------\n\n");

    const prompt = `
You are a Content Niche Classifier. Your task is to analyze these ${scripts.length} video scripts and classify their NICHE (Industry/Topic) and TONE/STYLE.

INPUT SCRIPTS:
${scriptsContext}

TASK:
For EACH script, determine the:
1. Niche: The specific industry or category (e.g. "Crypto", "Health", "Gaming", "Personal Finance", "Cooking", "Self-Help"). Be specific.
2. Tone: The dominant emotional tone (e.g. "Urgent", "Calm", "Funny", "Serious", "Dramatic").

OUTPUT FORMAT:
Return PURE JSON ARRAY. No markdown.
[
  { "scriptIndex": 1, "niche": "Crypto", "tone": "Urgent" },
  { "scriptIndex": 2, "niche": "Health", "tone": "Calm" }
]
`;

    try {
        const response = await generateContentViaOpenRouter(
            targetModel,
            "You are a helpful JSON bot.",
            prompt,
            apiKey,
            true
        );

        // Parse JSON response
        const cleaned = response.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleaned) as NicheAnalysisResult[];
    } catch (error) {
        console.error("Niche detection failed:", error);
        // Fallback: return neutral results so we don't block the user
        return scripts.map((_, i) => ({ scriptIndex: i + 1, niche: "Unknown", tone: "Unknown" }));
    }
};

export const analyzeNicheCompatibility = (results: NicheAnalysisResult[]): {
    majorityNiche: string;
    matchedIndices: number[];
    mismatchedIndices: number[];
} => {
    if (results.length === 0) return { majorityNiche: "", matchedIndices: [], mismatchedIndices: [] };

    const counts: Record<string, number> = {};
    results.forEach(r => {
        const n = r.niche || "Unknown";
        counts[n] = (counts[n] || 0) + 1;
    });

    let majorityNiche = "";
    let maxCount = -1;
    for (const [niche, count] of Object.entries(counts)) {
        if (count > maxCount) {
            maxCount = count;
            majorityNiche = niche;
        }
    }

    const matchedIndices: number[] = [];
    const mismatchedIndices: number[] = [];

    results.forEach(r => {
        const n = r.niche || "Unknown";
        if (n === majorityNiche) {
            matchedIndices.push(r.scriptIndex);
        } else {
            mismatchedIndices.push(r.scriptIndex);
        }
    });

    return { majorityNiche, matchedIndices, mismatchedIndices };
};
