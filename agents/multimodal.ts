
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { MODEL_NAME, SYSTEM_INSTRUCTION_MULTIMODAL } from "../config";
import { getApiKey, retryWithBackoff, wrapGenAIError } from "../utils";
import { checkRateLimit, recordRequest } from "../utils/rate-limiter";

export const runMultiModalAgent = async (input: string, image?: string, audio?: string, modelName?: string): Promise<string> => {
  const activeModel = modelName || MODEL_NAME;
  checkRateLimit('default');
  // If no media is provided, just return the text input
  if (!image && !audio) return input;

  recordRequest('default'); // Record attempt immediately to track all requests including failures
  const key = await getApiKey();
  const ai = new GoogleGenAI({ apiKey: key });
  
  const parts: any[] = [{ text: `User Text Context: ${input}` }];

  if (image) {
    parts.push({
      inlineData: { mimeType: "image/jpeg", data: image }
    });
  }
  
  if (audio) {
    parts.push({
      inlineData: { mimeType: "audio/mp3", data: audio }
    });
  }

  try {
    const response = await retryWithBackoff(async () => await ai.models.generateContent({
      model: activeModel,
      config: { systemInstruction: SYSTEM_INSTRUCTION_MULTIMODAL },
      contents: [{ role: "user", parts: parts }]
    })) as GenerateContentResponse;

    const analysis = response.text || "";
    return `[Visual/Audio Context: ${analysis}] \n\n User Request: ${input}`;

  } catch (error) {
    console.error("MultiModal Agent Error:", error);
    throw wrapGenAIError(error);
  }
};
