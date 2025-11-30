/**
 * Custom Context System Types
 * Allows users to create and manage their own context categories
 */

export interface CustomContext {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  subContexts: SubContext[];
  createdAt: number;
  updatedAt: number;
}

export interface SubContext {
  id: string;
  name: string;
  value: string;
  promptContext: string;
  defaultMood?: string;
  defaultStyle?: string;
  defaultComplexity?: string;
  defaultRhyme?: string;
  defaultSinger?: string;
  suggestedKeywords?: string[];
}

export interface ContextSelection {
  contextId: string;
  subContextId: string;
  contextName: string;
  subContextName: string;
  promptContext: string;
}
