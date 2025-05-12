
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export type FeedType = 'global' | 'following' | 'for-you' | 'media';

export interface UserPreferences {
  defaultFeed: FeedType;
  feedFilters: {
    showReplies: boolean;
    showReposted: boolean;
    hideFromUsers: string[]; // pubkeys to hide
  };
  contentPreferences: {
    showSensitiveContent: boolean;
    showMediaByDefault: boolean;
    showPreviewImages: boolean;
    dataSaverMode: boolean;
    preferredQuality: 'low' | 'medium' | 'high';
  };
  notificationPreferences: {
    notifyOnMentions: boolean;
    notifyOnReplies: boolean;
    notifyOnReactions: boolean;
  };
  relayPreferences: {
    autoConnect: boolean;
    connectTimeout: number; // in milliseconds
  };
  uiPreferences: {
    compactMode: boolean;
    fontSize: 'small' | 'medium' | 'large';
    showTrending: boolean;
    layoutView: 'standard' | 'compact' | 'comfortable';
    theme: 'system' | 'light' | 'dark';
  };
}

const defaultPreferences: UserPreferences = {
  defaultFeed: 'global',
  feedFilters: {
    showReplies: true,
    showReposted: true,
    hideFromUsers: [],
  },
  contentPreferences: {
    showSensitiveContent: false,
    showMediaByDefault: true,
    showPreviewImages: true,
    dataSaverMode: false,
    preferredQuality: 'high',
  },
  notificationPreferences: {
    notifyOnMentions: true,
    notifyOnReplies: true,
    notifyOnReactions: false,
  },
  relayPreferences: {
    autoConnect: true,
    connectTimeout: 5000,
  },
  uiPreferences: {
    compactMode: false,
    fontSize: 'medium',
    showTrending: true,
    layoutView: 'standard',
    theme: 'system',
  },
};

// Storage keys for splitting preferences into smaller chunks
const STORAGE_KEYS = {
  MAIN: 'blocknoster_preferences_main',
  FEED_FILTERS: 'blocknoster_preferences_filters',
  CONTENT_PREFS: 'blocknoster_preferences_content',
  NOTIFICATION_PREFS: 'blocknoster_preferences_notifications',
  RELAY_PREFS: 'blocknoster_preferences_relays',
  UI_PREFS: 'blocknoster_preferences_ui'
};

// Safely save to localStorage with error handling
const safeLocalStorageSave = (key: string, value: any): boolean => {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`Failed to save to localStorage (${key}):`, error);
    
    // Show error notification only once
    if (key === STORAGE_KEYS.MAIN) {
      toast.error("Unable to save preferences", {
        description: "Storage limit reached. Some preferences may not persist."
      });
    }
    
    return false;
  }
};

// Safely load from localStorage with error handling
const safeLocalStorageLoad = <T>(key: string, defaultValue: T): T => {
  try {
    const serialized = localStorage.getItem(key);
    if (serialized === null) return defaultValue;
    return JSON.parse(serialized) as T;
  } catch (error) {
    console.error(`Failed to load from localStorage (${key}):`, error);
    return defaultValue;
  }
};

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loaded, setLoaded] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);

  // Test if localStorage is available
  useEffect(() => {
    try {
      const testKey = 'blocknoster_storage_test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      setStorageAvailable(true);
    } catch (e) {
      console.error('localStorage not available:', e);
      setStorageAvailable(false);
    }
  }, []);

  // Load preferences from localStorage with chunked storage
  useEffect(() => {
    if (!storageAvailable) {
      setLoaded(true);
      return;
    }
    
    try {
      // Load individual preference sections
      const mainPrefs = safeLocalStorageLoad<Partial<UserPreferences>>(STORAGE_KEYS.MAIN, {});
      const feedFilters = safeLocalStorageLoad(STORAGE_KEYS.FEED_FILTERS, defaultPreferences.feedFilters);
      const contentPreferences = safeLocalStorageLoad(STORAGE_KEYS.CONTENT_PREFS, defaultPreferences.contentPreferences);
      const notificationPreferences = safeLocalStorageLoad(STORAGE_KEYS.NOTIFICATION_PREFS, defaultPreferences.notificationPreferences);
      const relayPreferences = safeLocalStorageLoad(STORAGE_KEYS.RELAY_PREFS, defaultPreferences.relayPreferences);
      const uiPreferences = safeLocalStorageLoad(STORAGE_KEYS.UI_PREFS, defaultPreferences.uiPreferences);
      
      // Merge all preferences with defaults for any missing properties
      const mergedPreferences: UserPreferences = {
        ...defaultPreferences,
        ...mainPrefs,
        feedFilters,
        contentPreferences,
        notificationPreferences,
        relayPreferences,
        uiPreferences
      };
      
      setPreferences(mergedPreferences);
    } catch (error) {
      console.error('Failed to load preferences:', error);
      // Fall back to defaults
      setPreferences(defaultPreferences);
    }
    
    setLoaded(true);
  }, [storageAvailable]);

  // Save preferences to localStorage with chunking to avoid quota issues
  useEffect(() => {
    if (loaded && storageAvailable) {
      // Save main preferences (excluding nested objects which we'll save separately)
      const mainPrefs = {
        defaultFeed: preferences.defaultFeed
      };
      safeLocalStorageSave(STORAGE_KEYS.MAIN, mainPrefs);
      
      // Save each section separately to split storage
      safeLocalStorageSave(STORAGE_KEYS.FEED_FILTERS, preferences.feedFilters);
      safeLocalStorageSave(STORAGE_KEYS.CONTENT_PREFS, preferences.contentPreferences);
      safeLocalStorageSave(STORAGE_KEYS.NOTIFICATION_PREFS, preferences.notificationPreferences);
      safeLocalStorageSave(STORAGE_KEYS.RELAY_PREFS, preferences.relayPreferences);
      safeLocalStorageSave(STORAGE_KEYS.UI_PREFS, preferences.uiPreferences);
    }
  }, [preferences, loaded, storageAvailable]);

  // Update specific preference
  const updatePreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Update nested preference
  const updateNestedPreference = useCallback(<
    K extends keyof UserPreferences,
    NK extends keyof UserPreferences[K]
  >(
    key: K,
    nestedKey: NK,
    value: UserPreferences[K][NK]
  ) => {
    setPreferences(prev => {
      // Create a safe copy of the nested object with type checking
      const nestedObject = prev[key];
      
      if (nestedObject && typeof nestedObject === 'object' && !Array.isArray(nestedObject)) {
        // Create a new object of the appropriate type using type assertion
        const updatedNested = { ...nestedObject as object } as UserPreferences[K];
        // Set the new value
        (updatedNested as any)[nestedKey] = value;
        
        return {
          ...prev,
          [key]: updatedNested
        };
      }
      
      // Fallback: create a new object based on defaults if the nested object is invalid
      const defaultValue = defaultPreferences[key];
      return {
        ...prev,
        [key]: {
          ...(typeof defaultValue === 'object' && defaultValue !== null ? defaultValue : {}),
          [nestedKey]: value,
        } as UserPreferences[K],
      };
    });
  }, []);

  // Reset all preferences to default
  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
  }, []);

  return {
    preferences,
    updatePreference,
    updateNestedPreference,
    resetPreferences,
    loaded,
    storageAvailable
  };
}
