/**
 * Model Configuration
 * 
 * Centralized model names and API versions
 */

// Available Models - Loaded from environment variables
// These are display names only, actual model selection uses environment variables
export const AVAILABLE_MODELS = [
    { 
        id: import.meta.env.VITE_GOOGLE_GENAI_MODEL || "gemini-2.5-pro", 
        name: "Gemini 2.5 Pro",
        description: "Balanced quality and speed (Recommended)"
    },
    { 
        id: import.meta.env.VITE_GOOGLE_GENAI_MODEL_SECONDARY || "gemini-2.5-flash", 
        name: "Gemini 2.5 Flash",
        description: "Fastest, good for quick drafts"
    },
    { 
        id: import.meta.env.VITE_GOOGLE_GENAI_MODEL_THIRD || "gemini-3.0-pro", 
        name: "Gemini 3.0 Pro",
        description: "Highest quality, slower"
    },
];

// Primary models - Always from environment variables
export const MODEL_NAME = import.meta.env.VITE_GOOGLE_GENAI_MODEL || "gemini-2.5-pro"; // Default fallback
export const MODEL_FAST = import.meta.env.VITE_GOOGLE_GENAI_MODEL_SECONDARY || "gemini-2.5-flash"; // Default fallback
export const MODEL_ADVANCED = import.meta.env.VITE_GOOGLE_GENAI_MODEL_THIRD || "gemini-3.0-pro"; // Default fallback
export const PROMPT_VERSION = "2.1.0";

// Model-specific configurations
export const MODEL_CONFIGS = {
    reasoning: {
        model: MODEL_NAME,
        temperature: 0.85,
        topK: 40,
        thinkingBudget: 4096
    },
    fast: {
        model: MODEL_FAST,
        temperature: 0.7,
        topK: 40
    }
};

// Audio/TTS models - Use environment variables when available
export const TTS_MODEL = import.meta.env.VITE_TTS_MODEL || "gemini-2.5-flash-preview-tts";
export const IMAGE_MODEL = import.meta.env.VITE_IMAGE_MODEL || "imagen-4.0-generate-001";

// Suno/Audio defaults
export const DEFAULT_HQ_TAGS = "DTS, Dolby Atmos, Immersive Experience, High Fidelity, Spatial Audio, Masterpiece";
