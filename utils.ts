import { GeneratedLyrics } from "./types";

// Re-export context storage utilities
export * from "./utils/context-storage";

/**
 * Custom Error class for categorized AI failures with user-friendly messages
 */
export class GeminiError extends Error {
  constructor(
    message: string,
    public type: 'AUTH' | 'QUOTA' | 'SERVER' | 'NETWORK' | 'SAFETY' | 'PARSING' | 'UNKNOWN',
    public originalError?: any
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

/**
 * Safely retrieves data from localStorage without crashing
 */
export const getSafeLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    if (typeof window === 'undefined') return defaultValue;
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Storage Read Error (${key}):`, error);
    return defaultValue;
  }
};

/**
 * Safely saves data to localStorage
 */
export const setSafeLocalStorage = (key: string, value: any) => {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Storage Write Error (${key}):`, error);
  }
};

/**
 * Retrieves the API Key from secure storage (user-provided)
 * 
 * SECURITY NOTE: API keys should NEVER be embedded in code.
 * Users must provide their own keys from https://aistudio.google.com/
 */
export const getApiKey = async (): Promise<string> => {
  try {
    // Try to import secureStorage (async to avoid circular dependencies)
    const { secureStorage } = await import('./utils/secure-storage');
    const key = await secureStorage.getItem<string>('user_api_key');

    if (!key) {
      throw new GeminiError(
        'No API key configured. Please add your Google Gemini API key in Settings.\n' +
        'Get your free key at: https://aistudio.google.com/',
        'AUTH'
      );
    }

    return key;
  } catch (error: any) {
    if (error instanceof GeminiError) throw error;

    // If localStorage fails, try process.env as last resort
    const envKey = process.env.API_KEY;
    if (envKey) {
      console.warn('[API KEY] Using fallback from .env file');
      return envKey;
    }
    
    throw new GeminiError(
      'No API key configured. Please add your Google Gemini API key in Settings.\n' +
      'Get your free key at: https://aistudio.google.com/',
      'AUTH'
    );
  }
};

/**
 * Timeout wrapper for async operations
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = 30000,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new GeminiError(timeoutMessage, 'NETWORK')), timeoutMs)
    )
  ]);
}

/**
 * Retry mechanism with exponential backoff and timeout protection
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  retries: number = 2,
  delay: number = 2000,
  timeoutMs: number = 30000
): Promise<T> {
  const maxRetries = retries;
  const attemptNumber = maxRetries - retries + 1;
  console.log(`[RETRY] Attempt ${attemptNumber}/${maxRetries + 1}, delay: ${delay}ms, timeout: ${timeoutMs}ms`);
  
  try {
    const result = await withTimeout(operation, timeoutMs, 'Request timed out after ' + (timeoutMs / 1000) + 's');
    console.log(`[RETRY] ✅ Success on attempt ${attemptNumber}`);
    return result;
  } catch (error: any) {
    // Check for fatal errors that should not be retried
    const msg = (error?.message || "").toLowerCase();
    console.error(`[RETRY] ❌ Attempt ${attemptNumber} failed:`, msg);
    
    if (msg.includes("api key") || msg.includes("safety") || msg.includes("blocked") || msg.includes("403")) {
      console.error(`[RETRY] Fatal error detected, not retrying:`, error.message);
      throw error;
    }

    if (retries === 0) {
      console.error(`[RETRY] Max retries exhausted, throwing error`);
      throw error;
    }

    const isTransient =
      msg.includes("429") ||
      msg.includes("503") ||
      msg.includes("overloaded") ||
      msg.includes("fetch") ||
      msg.includes("network");

    if (!isTransient) {
      console.error(`[RETRY] Non-transient error, not retrying:`, error.message);
      throw error;
    }

    console.log(`[RETRY] Transient error detected, waiting ${delay}ms before retry ${attemptNumber + 1}`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(operation, retries - 1, delay * 2);
  }
}

/**
 * Helper to wrap raw GoogleGenAI errors into categorized GeminiErrors with Human-Friendly messages
 */
export const wrapGenAIError = (error: any): GeminiError => {
  console.error("[ERROR WRAPPER] GenAI Original Error:", error);
  const msg = (error?.message || error?.toString() || "").toLowerCase();
  console.error("[ERROR WRAPPER] Error message:", msg);

  if (msg.includes("api key") || msg.includes("403") || msg.includes("unauthenticated") || msg.includes("key not valid")) {
    return new GeminiError("Access Denied: Your API Key appears to be invalid or expired. Please check your settings.", 'AUTH', error);
  }
  if (msg.includes("429") || msg.includes("quota") || msg.includes("exhausted")) {
    console.error("[ERROR WRAPPER] 🚫 429/QUOTA error detected!");
    console.error("[ERROR WRAPPER] Stack trace:", new Error().stack);
    return new GeminiError("System Busy: We're sending requests too fast for the AI. Please wait a moment and try again.", 'QUOTA', error);
  }
  if (msg.includes("503") || msg.includes("overloaded") || msg.includes("500") || msg.includes("internal")) {
    return new GeminiError("AI Overload: The AI service is currently experiencing high traffic. Please retry in a few seconds.", 'SERVER', error);
  }
  if (msg.includes("fetch") || msg.includes("network") || msg.includes("failed to fetch")) {
    return new GeminiError("Connection Lost: Please check your internet connection.", 'NETWORK', error);
  }
  if (msg.includes("safety") || msg.includes("blocked") || msg.includes("harmful") || msg.includes("candidate")) {
    return new GeminiError("Content Filter: The AI couldn't generate this content because it may violate safety guidelines.", 'SAFETY', error);
  }
  if (msg.includes("parse") || msg.includes("json") || msg.includes("syntax")) {
    return new GeminiError("Formatting Issue: The AI generated the content but messed up the format. Please try again.", 'PARSING', error);
  }

  return new GeminiError(error?.message || "An unexpected error occurred. Please try reloading.", 'UNKNOWN', error);
};

/**
 * Safely parses JSON from LLM responses, handling Markdown code blocks and partial text.
 */
export const cleanAndParseJSON = <T>(text: string): T => {
  if (!text) {
    throw new GeminiError("The AI returned an empty response.", 'PARSING');
  }

  let clean = text;

  // Remove markdown code blocks
  if (clean.includes("```")) {
    clean = clean.replace(/```(?:json)?/g, "").replace(/```/g, "");
  }

  // Find the first '{' and last '}' to strip messy preambles/postscripts
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  } else if (firstBrace !== -1) {
    // Attempt to recover if closing brace is missing (truncated response)
    clean = clean.substring(firstBrace) + "}";
  }

  try {
    return JSON.parse(clean);
  } catch (e) {
    console.warn("JSON Parse Failed on:", clean);
    // If strict parse fails, maybe try a looser regex extraction if applicable, or throw
    throw new GeminiError("The AI response could not be understood (JSON Parse Error).", 'PARSING', e);
  }
};

export const formatLyricsForDisplay = (data: GeneratedLyrics): string => {
  try {
    if (!data || !data.sections) return "Error: Invalid lyrics format received.";

    let output = "";
    if (data.title) output += `Title: ${data.title}\n`;
    if (data.language) output += `Language: ${data.language}\n`;
    if (data.ragam) output += `Raagam: ${data.ragam}\n`;
    if (data.taalam) output += `Taalam: ${data.taalam}\n`;
    if (data.structure) output += `Structure: ${data.structure}\n`;
    output += `\n`;

    data.sections.forEach(section => {
      let header = section.sectionName ? section.sectionName.trim() : "Section";
      header = header.replace(/[\[\](){}]/g, '');

      const lowerHeader = header.toLowerCase();
      if (lowerHeader.includes("pallavi")) header = "Chorus";
      else if (lowerHeader.includes("charanam")) header = "Verse";
      else if (lowerHeader.includes("anupallavi")) header = "Verse";
      else if (lowerHeader.includes("mukhda")) header = "Chorus";
      else if (lowerHeader.includes("antara")) header = "Verse";

      header = `[${header}]`;

      output += `${header}\n`;
      if (Array.isArray(section.lines)) {
        section.lines.forEach(line => {
          output += `${line}\n`;
        });
      }
      output += `\n`;
    });

    return output;
  } catch (error) {
    console.error("Error formatting lyrics:", error);
    return "Error: Could not format lyrics for display.";
  }
};

export const getLanguageCode = (lang: string): string => {
  const map: Record<string, string> = {
    "Hindi": "hi-IN",
    "Telugu": "te-IN",
    "Tamil": "ta-IN",
    "Kannada": "kn-IN",
    "Malayalam": "ml-IN",
    "Marathi": "mr-IN",
    "Gujarati": "gu-IN",
    "Bengali": "bn-IN",
    "Punjabi": "pa-IN",
    "Urdu": "ur-IN",
    "English": "en-IN",
    "Assamese": "as-IN"
  };
  return map[lang] || "en-IN";
};