/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_GENAI_MODEL: string
  readonly VITE_GOOGLE_GENAI_MODEL_SECONDARY: string
  readonly VITE_GOOGLE_GENAI_MODEL_THIRD: string
  readonly VITE_TTS_MODEL: string
  readonly VITE_IMAGE_MODEL: string
  readonly GEMINI_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
