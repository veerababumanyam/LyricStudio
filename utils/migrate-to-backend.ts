/**
 * Migration Utility - Move localStorage data to backend database
 * 
 * Detects existing localStorage data and provides functions to sync it
 * to the backend API with proper authentication.
 */

import { secureStorage } from './secure-storage';
import { preferencesAPI } from '../services/api/preferences.api';
import { songsAPI } from '../services/api/songs.api';
import { profilesAPI } from '../services/api/profiles.api';
import { contextsAPI } from '../services/api/contexts.api';

export interface MigrationStatus {
  needsMigration: boolean;
  items: {
    apiKey: boolean;
    appearance: boolean;
    savedSongs: boolean;
    profiles: boolean;
    customContexts: boolean;
    contextSelection: boolean;
  };
  counts: {
    songs: number;
    profiles: number;
    contexts: number;
  };
}

export interface MigrationProgress {
  step: string;
  current: number;
  total: number;
  percentage: number;
}

export type MigrationCallback = (progress: MigrationProgress) => void;

const MIGRATION_COMPLETE_KEY = 'swaz_migration_completed';
const APPEARANCE_KEY = 'swaz_appearance';
const SAVED_SONGS_KEY = 'swaz_saved_songs';
const PROFILES_KEY = 'geetgatha_profiles';
const CUSTOM_CONTEXTS_KEY = 'swaz_custom_contexts';
const CONTEXT_SELECTION_KEY = 'swaz_context_selection';
const CONTEXT_ORDER_KEY = 'swaz_context_order';

/**
 * Check if migration has been completed
 */
export function isMigrationComplete(): boolean {
  return localStorage.getItem(MIGRATION_COMPLETE_KEY) === 'true';
}

/**
 * Check what data exists in localStorage that needs migration
 */
export async function checkMigrationStatus(): Promise<MigrationStatus> {
  if (isMigrationComplete()) {
    return {
      needsMigration: false,
      items: {
        apiKey: false,
        appearance: false,
        savedSongs: false,
        profiles: false,
        customContexts: false,
        contextSelection: false
      },
      counts: {
        songs: 0,
        profiles: 0,
        contexts: 0
      }
    };
  }

  const apiKey = await secureStorage.getItem<string>('user_api_key');
  const appearance = localStorage.getItem(APPEARANCE_KEY);
  const savedSongs = localStorage.getItem(SAVED_SONGS_KEY);
  const profiles = localStorage.getItem(PROFILES_KEY);
  const customContexts = localStorage.getItem(CUSTOM_CONTEXTS_KEY);
  const contextSelection = localStorage.getItem(CONTEXT_SELECTION_KEY);

  let songsCount = 0;
  let profilesCount = 0;
  let contextsCount = 0;

  if (savedSongs) {
    try {
      songsCount = JSON.parse(savedSongs).length;
    } catch {}
  }

  if (profiles) {
    try {
      profilesCount = JSON.parse(profiles).length;
    } catch {}
  }

  if (customContexts) {
    try {
      contextsCount = JSON.parse(customContexts).length;
    } catch {}
  }

  const needsMigration = !!(
    apiKey ||
    appearance ||
    savedSongs ||
    profiles ||
    customContexts ||
    contextSelection
  );

  return {
    needsMigration,
    items: {
      apiKey: !!apiKey,
      appearance: !!appearance,
      savedSongs: !!savedSongs,
      profiles: !!profiles,
      customContexts: !!customContexts,
      contextSelection: !!contextSelection
    },
    counts: {
      songs: songsCount,
      profiles: profilesCount,
      contexts: contextsCount
    }
  };
}

/**
 * Migrate all data from localStorage to backend
 */
export async function migrateToBackend(
  onProgress?: MigrationCallback
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];
  let currentStep = 0;
  const totalSteps = 6;

  const updateProgress = (step: string, current: number) => {
    if (onProgress) {
      onProgress({
        step,
        current,
        total: totalSteps,
        percentage: Math.round((current / totalSteps) * 100)
      });
    }
  };

  try {
    // Step 1: Migrate API Key
    updateProgress('Migrating API key...', ++currentStep);
    try {
      const apiKey = await secureStorage.getItem<string>('user_api_key');
      if (apiKey) {
        await preferencesAPI.setApiKey(apiKey);
      }
    } catch (error) {
      errors.push(`API key migration failed: ${error}`);
    }

    // Step 2: Migrate Appearance Settings
    updateProgress('Migrating appearance settings...', ++currentStep);
    try {
      const appearance = localStorage.getItem(APPEARANCE_KEY);
      if (appearance) {
        const data = JSON.parse(appearance);
        await preferencesAPI.updatePreferences({
          font_size: data.fontSize,
          theme_id: data.themeId,
          custom_themes: data.customThemes,
          selected_model: data.selectedModel
        });
      }
    } catch (error) {
      errors.push(`Appearance migration failed: ${error}`);
    }

    // Step 3: Migrate Context Selection
    updateProgress('Migrating context preferences...', ++currentStep);
    try {
      const contextSelection = localStorage.getItem(CONTEXT_SELECTION_KEY);
      const contextOrder = localStorage.getItem(CONTEXT_ORDER_KEY);
      
      if (contextSelection || contextOrder) {
        await preferencesAPI.updatePreferences({
          context_selection: contextSelection ? JSON.parse(contextSelection) : null,
          context_order: contextOrder ? JSON.parse(contextOrder) : null
        });
      }
    } catch (error) {
      errors.push(`Context preferences migration failed: ${error}`);
    }

    // Step 4: Migrate Saved Songs
    updateProgress('Migrating saved songs...', ++currentStep);
    try {
      const savedSongs = localStorage.getItem(SAVED_SONGS_KEY);
      if (savedSongs) {
        const songs = JSON.parse(savedSongs);
        if (songs.length > 0) {
          await songsAPI.bulkCreateSongs(songs);
        }
      }
    } catch (error) {
      errors.push(`Songs migration failed: ${error}`);
    }

    // Step 5: Migrate Profiles
    updateProgress('Migrating profiles...', ++currentStep);
    try {
      const profiles = localStorage.getItem(PROFILES_KEY);
      if (profiles) {
        const profilesList = JSON.parse(profiles);
        if (profilesList.length > 0) {
          await profilesAPI.bulkCreateProfiles(profilesList);
        }
      }
    } catch (error) {
      errors.push(`Profiles migration failed: ${error}`);
    }

    // Step 6: Migrate Custom Contexts
    updateProgress('Migrating custom contexts...', ++currentStep);
    try {
      const customContexts = localStorage.getItem(CUSTOM_CONTEXTS_KEY);
      if (customContexts) {
        const contexts = JSON.parse(customContexts);
        if (contexts.length > 0) {
          await contextsAPI.bulkCreateContexts(contexts);
        }
      }
    } catch (error) {
      errors.push(`Contexts migration failed: ${error}`);
    }

    // Mark migration as complete
    if (errors.length === 0) {
      localStorage.setItem(MIGRATION_COMPLETE_KEY, 'true');
      updateProgress('Migration complete!', totalSteps);
    }

    return {
      success: errors.length === 0,
      errors
    };
  } catch (error) {
    errors.push(`Migration failed: ${error}`);
    return {
      success: false,
      errors
    };
  }
}

/**
 * Clear localStorage data after successful migration
 * Use this after confirming the migration was successful
 */
export function clearLocalStorageAfterMigration(): void {
  const keysToRemove = [
    'user_api_key',
    APPEARANCE_KEY,
    SAVED_SONGS_KEY,
    PROFILES_KEY,
    CUSTOM_CONTEXTS_KEY,
    CONTEXT_SELECTION_KEY,
    CONTEXT_ORDER_KEY
  ];

  keysToRemove.forEach(key => {
    try {
      if (key === 'user_api_key') {
        secureStorage.removeItem(key);
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Failed to remove ${key}:`, error);
    }
  });
}

/**
 * Reset migration status (for testing or re-migration)
 */
export function resetMigrationStatus(): void {
  localStorage.removeItem(MIGRATION_COMPLETE_KEY);
}

/**
 * Sync specific data type from backend to localStorage (for offline caching)
 */
export async function syncFromBackend(): Promise<void> {
  try {
    // Get preferences from backend
    const preferences = await preferencesAPI.getPreferences();
    
    // Cache appearance settings
    if (preferences.font_size || preferences.theme_id) {
      localStorage.setItem(APPEARANCE_KEY, JSON.stringify({
        fontSize: preferences.font_size,
        themeId: preferences.theme_id,
        customThemes: preferences.custom_themes,
        selectedModel: preferences.selected_model
      }));
    }

    // Cache context preferences
    if (preferences.context_selection) {
      localStorage.setItem(CONTEXT_SELECTION_KEY, JSON.stringify(preferences.context_selection));
    }
    if (preferences.context_order) {
      localStorage.setItem(CONTEXT_ORDER_KEY, JSON.stringify(preferences.context_order));
    }

    // Get and cache songs
    const { songs } = await songsAPI.getAllSongs();
    if (songs.length > 0) {
      localStorage.setItem(SAVED_SONGS_KEY, JSON.stringify(songs));
    }

    // Get and cache profiles
    const profiles = await profilesAPI.getAllProfiles();
    if (profiles.length > 0) {
      localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    }

    // Get and cache contexts
    const contexts = await contextsAPI.getAllContexts();
    if (contexts.length > 0) {
      localStorage.setItem(CUSTOM_CONTEXTS_KEY, JSON.stringify(contexts));
    }
  } catch (error) {
    console.error('Failed to sync from backend:', error);
    throw error;
  }
}
