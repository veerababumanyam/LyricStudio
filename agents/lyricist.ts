
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { MODEL_NAME, SYSTEM_INSTRUCTION_LYRICIST, SCENARIO_KNOWLEDGE_BASE } from "../config";
import { GeneratedLyrics, LanguageProfile, EmotionAnalysis, GenerationSettings } from "../types";
import { cleanAndParseJSON, formatLyricsForDisplay, wrapGenAIError, getApiKey, retryWithBackoff, GeminiError } from "../utils";
import { validateAgentInput, validateGenerationSettings } from "../utils/validation";
import { checkRateLimit, recordRequest } from "../utils/rate-limiter";

const getRhymeDescription = (scheme: string): string => {
  switch (scheme) {
    case "AABB": return "Couplets. Line 1 MUST rhyme with Line 2. Line 3 MUST rhyme with Line 4. (e.g., aa-ta, paa-ta)";
    case "ABAB": return "Alternate rhyme. Line 1 MUST rhyme with Line 3. Line 2 MUST rhyme with Line 4.";
    case "ABCB": return "Ballad style. Line 2 MUST rhyme with Line 4. Lines 1 and 3 do not need to rhyme.";
    case "AAAA": return "Monorhyme. All lines MUST end with the same phonetic sound.";
    case "AABCCB": return "Line 1 rhymes with 2. Line 4 rhymes with 5. Line 3 rhymes with 6.";
    case "Free Verse": return "No strict rhyme required, but focus on rhythm and flow.";
    default: return "Ensure consistent end rhymes (Anthya Prasa) for all couplets.";
  }
};

export const runLyricistAgent = async (
  researchData: string,
  userRequest: string,
  languageProfile: LanguageProfile,
  emotionData: EmotionAnalysis | undefined,
  generationSettings: GenerationSettings | undefined,
  onChunk?: (text: string) => void
): Promise<string> => {
  // 1. Validate inputs
  validateAgentInput(userRequest);

  if (generationSettings) {
    const settingsValidation = validateGenerationSettings(generationSettings);
    if (!settingsValidation.isValid) {
      throw new GeminiError(settingsValidation.error || 'Invalid settings', 'PARSING');
    }
    if (settingsValidation.warnings) {
      console.warn('Generation settings warnings:', settingsValidation.warnings);
    }
  }

  // 2. Check rate limit (lyricist has lower limit due to higher token usage)
  checkRateLimit('lyricist');

  // 3. Get API key securely
  const key = await getApiKey();
  const ai = new GoogleGenAI({ apiKey: key });

  const lyricsSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      language: { type: Type.STRING },
      ragam: { type: Type.STRING },
      taalam: { type: Type.STRING },
      structure: { type: Type.STRING },
      sections: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sectionName: { type: Type.STRING },
            lines: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["sectionName", "lines"]
        }
      }
    },
    required: ["title", "language", "ragam", "taalam", "sections"]
  };

  const isMixed = languageProfile.primary !== languageProfile.secondary || languageProfile.primary !== languageProfile.tertiary;
  const indianLanguages = ["Telugu", "Hindi", "Tamil", "Kannada", "Malayalam", "Marathi", "Gujarati", "Bengali", "Punjabi", "Odia", "Assamese", "Sanskrit", "Urdu"];
  const isIndian = indianLanguages.includes(languageProfile.primary);

  let languageInstruction = `PRIMARY LANGUAGE: "${languageProfile.primary}".`;
  if (isIndian) {
    languageInstruction += `\n    CRITICAL: Write the lyrics content STRICTLY in ${languageProfile.primary} NATIVE SCRIPT. DO NOT USE ROMAN/LATIN CHARACTERS.`;
  } else {
    languageInstruction += `\n    CRITICAL: Write the lyrics in standard ${languageProfile.primary} script.`;
  }
  if (isMixed) {
    languageInstruction += `\n    SECONDARY LANGUAGES: "${languageProfile.secondary}" and "${languageProfile.tertiary}". Mix naturally.`;
  }

  const getVal = (val: string | undefined, custom: string | undefined, def: string) => (val === "Custom" ? custom || def : val || def);
  const theme = getVal(generationSettings?.theme, generationSettings?.customTheme, "Love");
  const mood = getVal(generationSettings?.mood, generationSettings?.customMood, "Romantic");
  const style = getVal(generationSettings?.style, generationSettings?.customStyle, "Melody");
  const complexity = generationSettings?.complexity || "Poetic";
  const rhymeScheme = getVal(generationSettings?.rhymeScheme, generationSettings?.customRhymeScheme, "AABB");
  const singerConfig = getVal(generationSettings?.singerConfig, generationSettings?.customSingerConfig, "Male Solo");

  let scenarioInstruction = "";
  if (generationSettings?.ceremony && generationSettings.ceremony !== "None") {
    const foundScenario = SCENARIO_KNOWLEDGE_BASE.flatMap(c => c.events).find(e => e.id === generationSettings.ceremony);
    if (foundScenario) {
      scenarioInstruction = `SCENARIO: ${foundScenario.label}\n${foundScenario.promptContext}\nINSTRUCTION: Reference specific emotions and metaphors from this scenario.`;
    }
  }

  const prompt = `
    USER REQUEST: "${userRequest}"
    ${languageInstruction}
    STRICT CONFIGURATION: Theme: ${theme}, Mood: ${mood}, Style: ${style}, Complexity: ${complexity}, Singer: ${singerConfig}, Rhyme: ${rhymeScheme}
    ${scenarioInstruction}
    RHYME INSTRUCTION: ${getRhymeDescription(rhymeScheme)}
    EMOTIONAL ANALYSIS: ${emotionData?.navarasa || 'N/A'}, Intensity: ${emotionData?.intensity || 5}/10
    RESEARCH CONTEXT: ${researchData}
    
    TASK: Compose a high-fidelity song with [Intro], [Verse 1], [Chorus], [Verse 2], [Chorus], [Bridge], [Verse 3], [Chorus], [Outro].
    Output strictly in JSON format matching the schema.
  `;

  try {
    const stream = await retryWithBackoff(async () => await ai.models.generateContentStream({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_LYRICIST,
        responseMimeType: "application/json",
        responseSchema: lyricsSchema,
        thinkingConfig: { thinkingBudget: 4096 },
        temperature: 0.85,
      }
    }), 2, 2000, 60000); // 2 retries, 2s delay, 60s timeout (longer for streaming)

    let fullText = "";
    // Cast to any to avoid "unknown" iterator error, assuming SDK returns iterable
    for await (const chunk of (stream as any)) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        fullText += c.text;
        if (onChunk) onChunk(fullText);
      }
    }

    if (!fullText) {
      throw new GeminiError("The model returned an empty response.", 'SERVER');
    }

    // Record successful request
    recordRequest('lyricist');

    try {
      // Attempt clean parse
      const data = cleanAndParseJSON<GeneratedLyrics>(fullText);
      return formatLyricsForDisplay(data);
    } catch (parseError) {
      console.warn("Lyricist JSON Parse failed. Falling back to raw text recovery.", parseError);

      // Fallback: If we have substantial content, assume it is usable text even if JSON is broken.
      // This "Soft Fail" strategy prevents the user from seeing an error when valid content exists.
      if (fullText.length > 50) {
        // Create a synthetic structure to allow formatting tools to still sort of work
        const cleaned = fullText.replace(/[{}"[\],]/g, ' ').replace(/\s+/g, ' ').trim();
        return `(Note: The AI formatting was slightly off, but here is your song content)\n\n${fullText}`;
      }
      throw new GeminiError("Failed to parse lyrics generation output.", 'PARSING');
    }

  } catch (error) {
    console.error("Lyricist Agent Error:", error);
    throw wrapGenAIError(error);
  }
};
