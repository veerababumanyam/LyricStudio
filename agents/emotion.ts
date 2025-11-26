
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { MODEL_NAME, SYSTEM_INSTRUCTION_EMOTION } from "../config";
import { EmotionAnalysis } from "../types";
import { cleanAndParseJSON, getApiKey, retryWithBackoff, wrapGenAIError } from "../utils";
import { checkRateLimit, recordRequest } from "../utils/rate-limiter";

export const runEmotionAgent = async (topic: string, modelName?: string): Promise<EmotionAnalysis> => {
  const activeModel = modelName || MODEL_NAME;
  checkRateLimit('emotion');
  recordRequest('emotion');
  const key = await getApiKey();
  const ai = new GoogleGenAI({ apiKey: key });

  const emotionSchema = {
    type: Type.OBJECT,
    properties: {
      sentiment: { type: Type.STRING },
      navarasa: { type: Type.STRING },
      intensity: { type: Type.INTEGER },
      suggestedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
      vibeDescription: { type: Type.STRING }
    },
    required: ["sentiment", "navarasa", "intensity", "vibeDescription"]
  };

  try {
    const response = await retryWithBackoff(async () => await ai.models.generateContent({
      model: activeModel,
      contents: topic,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_EMOTION,
        responseMimeType: "application/json",
        responseSchema: emotionSchema,
        temperature: 0.6,
      }
    })) as GenerateContentResponse;

    if (response.text) {
      return cleanAndParseJSON<EmotionAnalysis>(response.text);
    }
    throw new Error("No response text");
  } catch (error) {
    console.error("[EMOTION AGENT] Failed:", error);
    // Fallback
    return {
      sentiment: "Neutral",
      navarasa: "Shanta",
      intensity: 5,
      suggestedKeywords: [],
      vibeDescription: "Balanced and calm"
    };
  }
};
