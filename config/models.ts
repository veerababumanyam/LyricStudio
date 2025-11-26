/**
 * Model Configuration
 * 
 * Centralized model names and API versions
 */

// Primary models
export const MODEL_NAME = "gemini-3-pro-preview";
export const MODEL_FAST = "gemini-2.5-flash";
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

// Audio/TTS models
export const TTS_MODEL = "gemini-2.5-flash-preview-tts";
export const IMAGE_MODEL = "imagen-4.0-generate-001";

// Suno/Audio defaults
export const DEFAULT_HQ_TAGS = "DTS, Dolby Atmos, Immersive Experience, High Fidelity, Spatial Audio, Masterpiece";
