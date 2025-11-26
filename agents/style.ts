
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { MODEL_FAST, SYSTEM_INSTRUCTION_STYLE_AGENT } from "../config";
import { getApiKey, retryWithBackoff, wrapGenAIError } from "../utils";

export const runStyleAgent = async (
  currentInput: string, 
  lyricsContext: string
): Promise<string> => {
  const key = getApiKey();
  const ai = new GoogleGenAI({ apiKey: key });

  const prompt = `
    USER INPUT / ROUGH IDEA: "${currentInput}"
    LYRICS CONTEXT: "${lyricsContext.substring(0, 300)}..."

    INSTRUCTION: 
    - Transform the user's rough idea into a pro-level Music Style Prompt.
    - **Scope:** Support ALL Global Music Styles (European, Western, Indian, Asian, etc.).
    - **If Indian:** Use Fusion Genres (e.g., EDM Carnatic, Trap Folk) and specific instruments (Sannai, Tabla).
    - **If European/Western:** Use specific sub-genres (e.g., Darkwave, Italo-Disco, Symphonic Metal) and era-specific sounds.
    - Append the mandatory High Fidelity tags.
    - If the user input is empty, generate a creative one based on the lyrics.
    - Output ONLY the final string.
  `;

  try {
    const response = await retryWithBackoff(async () => await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_STYLE_AGENT,
        temperature: 0.85, // High creativity for fusion
      }
    })) as GenerateContentResponse;

    return response.text?.trim() || currentInput;

  } catch (error) {
    console.error("Style Agent Error:", error);
    throw wrapGenAIError(error); 
  }
};
