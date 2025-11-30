/**
 * Model Configuration
 * 
 * Centralized model names and API versions
 * ALL values MUST come from environment variables (.env file)
 */

// Validate that required environment variables are set
if (!import.meta.env.VITE_GOOGLE_GENAI_MODEL) {
    console.error('VITE_GOOGLE_GENAI_MODEL is not set in .env file');
}
if (!import.meta.env.VITE_GOOGLE_GENAI_MODEL_SECONDARY) {
    console.error('VITE_GOOGLE_GENAI_MODEL_SECONDARY is not set in .env file');
}
if (!import.meta.env.VITE_GOOGLE_GENAI_MODEL_THIRD) {
    console.error('VITE_GOOGLE_GENAI_MODEL_THIRD is not set in .env file');
}

// Available Models - Loaded ONLY from environment variables
export const AVAILABLE_MODELS = [
    { 
        id: import.meta.env.VITE_GOOGLE_GENAI_MODEL, 
        name: "Gemini 2.5 Pro",
        description: "Balanced quality and speed (Recommended)"
    },
    { 
        id: import.meta.env.VITE_GOOGLE_GENAI_MODEL_SECONDARY, 
        name: "Gemini 2.5 Flash",
        description: "Fastest, good for quick drafts"
    },
    { 
        id: import.meta.env.VITE_GOOGLE_GENAI_MODEL_THIRD, 
        name: "Gemini 3 Pro Preview",
        description: "Latest preview model"
    },
];

// Primary models - ONLY from environment variables (NO FALLBACKS)
export const MODEL_NAME = import.meta.env.VITE_GOOGLE_GENAI_MODEL;
export const MODEL_FAST = import.meta.env.VITE_GOOGLE_GENAI_MODEL_SECONDARY;
export const MODEL_ADVANCED = import.meta.env.VITE_GOOGLE_GENAI_MODEL_THIRD;
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

// Audio/TTS models - ONLY from environment variables
export const TTS_MODEL = import.meta.env.VITE_TTS_MODEL;
export const IMAGE_MODEL = import.meta.env.VITE_IMAGE_MODEL;

// Suno/Audio defaults
export const DEFAULT_HQ_TAGS = "DTS, Dolby Atmos, Immersive Experience, High Fidelity, Spatial Audio, Masterpiece";
