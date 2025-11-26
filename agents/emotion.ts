
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { MODEL_NAME, SYSTEM_INSTRUCTION_EMOTION } from "../config";
import { EmotionAnalysis } from "../types";
import { cleanAndParseJSON, getApiKey, retryWithBackoff } from "../utils";

export const runEmotionAgent = async (input: string): Promise<EmotionAnalysis> => {
  const key = getApiKey();
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
      model: MODEL_NAME,
      contents: input,
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
    console.error("Emotion Agent Error:", error);
    return {
      sentiment: "Neutral",
      navarasa: "Shanta",
      intensity: 5,
      suggestedKeywords: [],
      vibeDescription: "Balanced and calm"
    };
  }
};
