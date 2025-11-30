/**
 * Context Storage Utilities
 * Manages persistent storage of custom contexts
 */

import { CustomContext, SubContext } from '../types/context';

const STORAGE_KEY = 'swaz_custom_contexts';
const SELECTION_KEY = 'swaz_context_selection';
const ORDER_KEY = 'swaz_context_order';

/**
 * Load all custom contexts from localStorage
 */
export const loadCustomContexts = (): CustomContext[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to load custom contexts:', error);
    return [];
  }
};

/**
 * Save custom contexts to localStorage
 */
export const saveCustomContexts = (contexts: CustomContext[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contexts));
  } catch (error) {
    console.error('Failed to save custom contexts:', error);
  }
};

/**
 * Add a new custom context
 */
export const addCustomContext = (context: Omit<CustomContext, 'id' | 'createdAt' | 'updatedAt'>): CustomContext => {
  const contexts = loadCustomContexts();
  const newContext: CustomContext = {
    ...context,
    id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  contexts.push(newContext);
  saveCustomContexts(contexts);
  return newContext;
};

/**
 * Update an existing custom context
 */
export const updateCustomContext = (id: string, updates: Partial<CustomContext>): void => {
  const contexts = loadCustomContexts();
  const index = contexts.findIndex(c => c.id === id);
  if (index !== -1 && contexts[index]) {
    contexts[index] = {
      ...contexts[index],
      ...updates,
      id: contexts[index].id, // Preserve original ID
      createdAt: contexts[index].createdAt, // Preserve creation date
      updatedAt: Date.now(),
    } as CustomContext;
    saveCustomContexts(contexts);
  }
};

/**
 * Delete a custom context
 */
export const deleteCustomContext = (id: string): void => {
  const contexts = loadCustomContexts();
  const filtered = contexts.filter(c => c.id !== id);
  saveCustomContexts(filtered);
};

/**
 * Add a sub-context to an existing context
 */
export const addSubContext = (contextId: string, subContext: Omit<SubContext, 'id'>): void => {
  const contexts = loadCustomContexts();
  const context = contexts.find(c => c.id === contextId);
  if (context) {
    const newSubContext: SubContext = {
      ...subContext,
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    context.subContexts.push(newSubContext);
    context.updatedAt = Date.now();
    saveCustomContexts(contexts);
  }
};

/**
 * Update a sub-context
 */
export const updateSubContext = (contextId: string, subContextId: string, updates: Partial<SubContext>): void => {
  const contexts = loadCustomContexts();
  const context = contexts.find(c => c.id === contextId);
  if (context) {
    const subIndex = context.subContexts.findIndex(s => s.id === subContextId);
    if (subIndex !== -1 && context.subContexts[subIndex]) {
      context.subContexts[subIndex] = {
        ...context.subContexts[subIndex],
        ...updates,
        id: context.subContexts[subIndex].id, // Preserve ID
      } as SubContext;
      context.updatedAt = Date.now();
      saveCustomContexts(contexts);
    }
  }
};

/**
 * Delete a sub-context
 */
export const deleteSubContext = (contextId: string, subContextId: string): void => {
  const contexts = loadCustomContexts();
  const context = contexts.find(c => c.id === contextId);
  if (context) {
    context.subContexts = context.subContexts.filter(s => s.id !== subContextId);
    context.updatedAt = Date.now();
    saveCustomContexts(contexts);
  }
};

/**
 * Save currently selected context
 */
export const saveContextSelection = (contextId: string, subContextId: string): void => {
  try {
    localStorage.setItem(SELECTION_KEY, JSON.stringify({ contextId, subContextId }));
  } catch (error) {
    console.error('Failed to save context selection:', error);
  }
};

/**
 * Load currently selected context
 */
export const loadContextSelection = (): { contextId: string; subContextId: string } | null => {
  try {
    const stored = localStorage.getItem(SELECTION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load context selection:', error);
    return null;
  }
};

/**
 * Get a specific context and sub-context by IDs
 */
export const getContextById = (contextId: string, subContextId?: string): { context: CustomContext | null; subContext: SubContext | null } => {
  const contexts = loadCustomContexts();
  const context = contexts.find(c => c.id === contextId) || null;
  
  if (!context || !subContextId) {
    return { context, subContext: null };
  }
  
  const subContext = context.subContexts.find(s => s.id === subContextId) || null;
  return { context, subContext };
};

/**
 * Save context order to localStorage
 */
export const saveContextOrder = (contextIds: string[]): void => {
  try {
    localStorage.setItem(ORDER_KEY, JSON.stringify(contextIds));
  } catch (error) {
    console.error('Failed to save context order:', error);
  }
};

/**
 * Load context order from localStorage
 */
export const loadContextOrder = (): string[] => {
  try {
    const stored = localStorage.getItem(ORDER_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load context order:', error);
    return [];
  }
};

/**
 * Reorder contexts based on saved order
 */
export const reorderContexts = (contexts: CustomContext[]): CustomContext[] => {
  const order = loadContextOrder();
  if (order.length === 0) return contexts;

  const ordered: CustomContext[] = [];
  const unordered: CustomContext[] = [];

  // Add contexts in saved order
  order.forEach(id => {
    const context = contexts.find(c => c.id === id);
    if (context) ordered.push(context);
  });

  // Add any new contexts that weren't in the saved order
  contexts.forEach(context => {
    if (!order.includes(context.id)) unordered.push(context);
  });

  return [...ordered, ...unordered];
};

/**
 * Update context with reordered sub-contexts
 */
export const reorderSubContexts = (contextId: string, subContextIds: string[]): void => {
  const contexts = loadCustomContexts();
  const context = contexts.find(c => c.id === contextId);
  
  if (context) {
    const reordered: SubContext[] = [];
    
    // Add sub-contexts in new order
    subContextIds.forEach(id => {
      const subContext = context.subContexts.find(s => s.id === id);
      if (subContext) reordered.push(subContext);
    });
    
    // Add any missing sub-contexts
    context.subContexts.forEach(subContext => {
      if (!subContextIds.includes(subContext.id)) reordered.push(subContext);
    });
    
    context.subContexts = reordered;
    context.updatedAt = Date.now();
    saveCustomContexts(contexts);
  }
};
