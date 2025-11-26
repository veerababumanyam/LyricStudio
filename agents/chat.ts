
import { GoogleGenAI } from "@google/genai";
import { MODEL_NAME, SYSTEM_INSTRUCTION_CHAT } from "../config";
import { Message } from "../types";
import { wrapGenAIError, getApiKey, retryWithBackoff } from "../utils";
import { validateAgentInput } from "../utils/validation";
import { checkRateLimit, recordRequest } from "../utils/rate-limiter";

import { LanguageProfile, GenerationSettings } from "../types";

// Define Part type locally to ensure type safety without depending on specific SDK exports
type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

export interface ChatAgentOptions {
  image?: string; // Base64 string
  audio?: string; // Base64 string
  context?: {
    language: LanguageProfile;
    generation: GenerationSettings;
  };
  modelName?: string; // New optional parameter
}

/**
 * Filters history to maintain relevance while staying within token limits.
 * Implements a sliding window approach (Last 15 turns) which is efficient for chat.
 */
const getOptimizedHistory = (history: Message[]): { role: string, parts: Part[] }[] => {
  const MAX_HISTORY_TURNS = 15;

  // Filter for valid chat roles and slice the last N messages
  const recentHistory = history
    .filter(m => m.role === "user" || m.role === "model")
    .slice(-MAX_HISTORY_TURNS);

  return recentHistory.map(m => ({
    role: m.role,
    parts: [{ text: m.content }]
  }));
};

/**
 * Generates a dynamic system instruction based on the conversation context.
 * This allows the agent to adapt its persona (e.g., empathetic vs. technical).
 */
const getDynamicInstruction = (history: Message[], currentInput: string, context?: ChatAgentOptions['context']) => {
  let instruction = SYSTEM_INSTRUCTION_CHAT;
  const lowerInput = currentInput.toLowerCase();

  // 0. Inject Sidebar Context (CRITICAL)
  if (context) {
    instruction += `\n\n[CURRENT SIDEBAR SETTINGS]
    The user has already configured the following settings in the UI. DO NOT ask for this information again unless they explicitly want to change it.
    - Primary Language: ${context.language.primary}
    - Secondary Language: ${context.language.secondary}
    - Mood: ${context.generation.mood}
    - Style: ${context.generation.style}
    - Theme: ${context.generation.theme}
    - Complexity: ${context.generation.complexity}
    
    If the user asks to "start" or "create", assume these settings apply immediately.`;
  }

  // 1. Context: Feedback on Lyrics
  const lastModelMsg = [...history].reverse().find(m => m.role === "model");
  if (lastModelMsg?.lyricsData) {
    instruction += `\n\n[CONTEXT: POST-GENERATION]\nThe user is discussing the lyrics you just helped orchestrate.
    - If they offer critique, be humble and suggest specific linguistic or rhythmic fixes.
    - If they ask about the 'Raagam' or 'Thalam', explain like a knowledgeable music director.
    - If they are satisfied, suggest next steps (e.g., "Shall we try a different stanza?").`;
  }

  // 2. Intent: Emotional Tone Detection
  if (/(sad|pain|tears|breakup|lonely|loss)/i.test(lowerInput)) {
    instruction += `\n\n[TONE: EMPATHETIC]\nThe user seems to be in a somber mood. Respond with poetic empathy and gentleness.`;
  } else if (/(party|dance|beat|energy|fast|fun)/i.test(lowerInput)) {
    instruction += `\n\n[TONE: ENERGETIC]\nThe user wants high energy. Keep your responses punchy, rhythmic, and enthusiastic.`;
  }

  return instruction;
};

export const runChatAgent = async (
  text: string,
  history: Message[],
  options: ChatAgentOptions | undefined
) => {
  const activeModel = options?.modelName || MODEL_NAME;
  console.log(`[CHAT AGENT] 💬 Called with text: "${text.substring(0, 50)}..."`);
  console.log(`[CHAT AGENT] Using Model: ${activeModel}`);
  
  // 1. Validate input
  validateAgentInput(text);

  // 2. Check rate limit
  checkRateLimit('chat');
  recordRequest('chat'); // Record attempt immediately to track all requests including failures

  // 3. Get API key securely
  const key = await getApiKey();
  const ai = new GoogleGenAI({ apiKey: key });

  const chatHistory = getOptimizedHistory(history);

  const currentParts: Part[] = [{ text: text }];

  if (options?.image) {
    currentParts.push({
      inlineData: { mimeType: "image/jpeg", data: options.image }
    });
  }

  if (options?.audio) {
    currentParts.push({
      inlineData: { mimeType: "audio/mp3", data: options.audio }
    });
  }

  const contents = [
    ...chatHistory,
    { role: "user", parts: currentParts }
  ];

  const systemInstruction = getDynamicInstruction(history, text, options?.context);

  try {
    const response = await retryWithBackoff(async () => {
      const response = await ai.models.generateContent({
        model: activeModel,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
          topK: 40,
        },
        contents: contents
      });
      return response.text || "I'm listening... could you tell me more?";
    }, 2, 2000, 30000); // 2 retries, 2s delay, 30s timeout

    return response;

  } catch (error) {
    console.warn("Chat Agent failed.", error);
    throw wrapGenAIError(error);
  }
};
