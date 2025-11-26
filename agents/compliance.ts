
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { MODEL_NAME, SYSTEM_INSTRUCTION_COMPLIANCE } from "../config";
import { ComplianceReport, GeneratedLyrics } from "../types";
import { cleanAndParseJSON, getApiKey, retryWithBackoff } from "../utils";
import { checkRateLimit, recordRequest } from "../utils/rate-limiter";

export const runComplianceAgent = async (lyrics: GeneratedLyrics | string, modelName?: string): Promise<ComplianceReport> => {
  const activeModel = modelName || MODEL_NAME;
  checkRateLimit('default');
  recordRequest('default'); // Record attempt immediately to track all requests including failures
  const safeDefault: ComplianceReport = {
    originalityScore: 100,
    flaggedPhrases: [],
    similarSongs: [],
    verdict: "Skipped (System Busy)"
  };

  try {
    const key = await getApiKey();
    if (!key) return safeDefault;
    
    const ai = new GoogleGenAI({ apiKey: key });
    
    const lyricsText = typeof lyrics === 'string' ? lyrics : JSON.stringify(lyrics);

    const complianceSchema = {
      type: Type.OBJECT,
      properties: {
        originalityScore: { type: Type.INTEGER, description: "0 to 100" },
        flaggedPhrases: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "Phrases that sound too similar to existing famous songs" 
        },
        similarSongs: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "Names of songs that share style or lyrics"
        },
        verdict: { type: Type.STRING, description: "Safe, Caution, or High Risk" }
      },
      required: ["originalityScore", "verdict"]
    };

    const response = await retryWithBackoff(async () => await ai.models.generateContent({
      model: activeModel,
      contents: `Analyze these lyrics for copyright risks:\n${lyricsText}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_COMPLIANCE,
        responseMimeType: "application/json",
        responseSchema: complianceSchema,
        temperature: 0.1
      }
    })) as GenerateContentResponse;

    if (response.text) {
      try {
        return cleanAndParseJSON<ComplianceReport>(response.text);
      } catch (e) {
        console.warn("Compliance JSON parse failed. Using safe default.", e);
        return safeDefault;
      }
    }
    
    return safeDefault;

  } catch (error) {
    console.warn("Compliance Agent failed silently. Continuing workflow.", error);
    return safeDefault; // Fail open to allow user flow
  }
};
