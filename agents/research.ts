
import { GoogleGenAI } from "@google/genai";
import { MODEL_NAME, RESEARCH_PROMPT_TEMPLATE } from "../config";
import { getApiKey, retryWithBackoff, wrapGenAIError } from "../utils";
import { checkRateLimit, recordRequest } from "../utils/rate-limiter";

export const runResearchAgent = async (topic: string, mood: string | undefined, modelName?: string) => {
  const activeModel = modelName || MODEL_NAME;
  checkRateLimit('research');
  recordRequest('research'); // Record attempt immediately to track all requests including failures
  const key = await getApiKey();
  const ai = new GoogleGenAI({ apiKey: key });
  
  const searchPrompt = `${RESEARCH_PROMPT_TEMPLATE(topic, mood)}
  
  CRITICAL INSTRUCTION: 
  Use Google Search to find:
  1. Recent lyrical trends or slang relevant to this topic.
  2. If the user references a specific movie or song style, find its details (Composer, Raagam, Vibe).
  3. Cultural metaphors associated with this specific mood.
  `;

  try {
    return await retryWithBackoff(async () => {
        const response = await ai.models.generateContent({
          model: activeModel,
          contents: searchPrompt,
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.7
          }
        });

        let resultText = response.text || "";

        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        if (groundingMetadata?.groundingChunks) {
          const sources = groundingMetadata.groundingChunks
            .map((chunk: any) => chunk.web?.title ? `- ${chunk.web.title} (${chunk.web.uri})` : null)
            .filter(Boolean);
            
          if (sources.length > 0) {
            resultText += "\n\n[RESEARCH SOURCES]:\n" + sources.join("\n");
          }
        }
        return resultText;
    });

  } catch (error) {
    console.warn("Research Agent (Search) failed, falling back to basic knowledge...", error);
    console.log("[RESEARCH AGENT] Using fallback (no search tools)");
    try {
        // Note: Rate limit already checked and recorded at function start
        // Fallback uses same quota allocation
        const fallbackResponse = await ai.models.generateContent({
          model: activeModel,
          contents: RESEARCH_PROMPT_TEMPLATE(topic, mood)
        });
        return fallbackResponse.text || "";
    } catch (e) {
        console.error("[RESEARCH AGENT] Fallback also failed:", e);
        throw wrapGenAIError(e);
    }
  }
};
