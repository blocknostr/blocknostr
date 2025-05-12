
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
  DEFAULT_FEED: 'bn_pref_default_feed',
  FEED_FILTERS: 'bn_pref_feed_filters', 
  CONTENT_PREFS: 'bn_pref_content',
  NOTIFICATION_PREFS: 'bn_pref_notif',
  RELAY_PREFS: 'bn_pref_relay',
  UI_PREFS: 'bn_pref_ui',
  // Even more granular storage keys for large arrays
  HIDDEN_USERS: 'bn_pref_hidden_users',
  STORAGE_STATUS: 'bn_storage_status'
};

// Compress arrays by joining with delimiter 
const compressArray = (array: string[]): string => {
  return array.join('|');
};

// Decompress string back to array
const decompressArray = (compressed: string): string[] => {
  return compressed ? compressed.split('|') : [];
};

// Safely save to localStorage with error handling
const safeLocalStorageSave = (key: string, value: any): boolean => {
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`Failed to save to localStorage (${key}):`, error);
    
    // Mark storage as problematic
    try {
      localStorage.setItem(STORAGE_KEYS.STORAGE_STATUS, 'limited');
    } catch (e) {
      // If we can't even save this, storage is completely unavailable
      console.error("Storage completely unavailable:", e);
    }
    
    return false;
  }
};

// Safely load from localStorage with error handling
const safeLocalStorageLoad = <T>(key: string, defaultValue: T): T => {
  try {
    const serialized = localStorage.getItem(key);
    if (serialized === null) return defaultValue;
    
    // If the value is a compressed array (starts with pipe or alphanumeric)
    if (typeof defaultValue === 'object' && Array.isArray(defaultValue) && 
        (typeof serialized === 'string' && /^[a-zA-Z0-9|]+$/.test(serialized))) {
      return decompressArray(serialized) as unknown as T;
    }
    
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
  const [storageQuotaReached, setStorageQuotaReached] = useState(false);

  // Test if localStorage is available
  useEffect(() => {
    try {
      const testKey = 'blocknoster_storage_test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      
      // Check if we previously had storage issues
      const storageStatus = localStorage.getItem(STORAGE_KEYS.STORAGE_STATUS);
      if (storageStatus === 'limited') {
        setStorageQuotaReached(true);
      }
      
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
      const defaultFeed = safeLocalStorageLoad<FeedType>(STORAGE_KEYS.DEFAULT_FEED, defaultPreferences.defaultFeed);
      
      // Load feed filters except hidden users (which we'll handle separately)
      const feedFilters = safeLocalStorageLoad(STORAGE_KEYS.FEED_FILTERS, {
        showReplies: defaultPreferences.feedFilters.showReplies,
        showReposted: defaultPreferences.feedFilters.showReposted,
      });
      
      // Load hidden users array separately (could be large)
      let hideFromUsers: string[] = [];
      try {
        const compressedUsers = localStorage.getItem(STORAGE_KEYS.HIDDEN_USERS);
        hideFromUsers = compressedUsers ? decompressArray(compressedUsers) : [];
      } catch (e) {
        console.error('Failed to load hidden users:', e);
        hideFromUsers = [];
      }
      
      const contentPreferences = safeLocalStorageLoad(STORAGE_KEYS.CONTENT_PREFS, defaultPreferences.contentPreferences);
      const notificationPreferences = safeLocalStorageLoad(STORAGE_KEYS.NOTIFICATION_PREFS, defaultPreferences.notificationPreferences);
      const relayPreferences = safeLocalStorageLoad(STORAGE_KEYS.RELAY_PREFS, defaultPreferences.relayPreferences);
      const uiPreferences = safeLocalStorageLoad(STORAGE_KEYS.UI_PREFS, defaultPreferences.uiPreferences);
      
      // Merge all preferences with defaults for any missing properties
      const mergedPreferences: UserPreferences = {
        ...defaultPreferences,
        defaultFeed,
        feedFilters: {
          ...defaultPreferences.feedFilters,
          ...feedFilters,
          hideFromUsers,
        },
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
      // Track if any saves failed
      let anySaveFailed = false;
      
      // Save default feed
      const feedSuccess = safeLocalStorageSave(STORAGE_KEYS.DEFAULT_FEED, preferences.defaultFeed);
      if (!feedSuccess) anySaveFailed = true;
      
      // Save feed filters without the potentially large hideFromUsers array
      const feedFilters = {
        showReplies: preferences.feedFilters.showReplies,
        showReposted: preferences.feedFilters.showReposted
      };
      const filtersSuccess = safeLocalStorageSave(STORAGE_KEYS.FEED_FILTERS, feedFilters);
      if (!filtersSuccess) anySaveFailed = true;
      
      // Save hidden users as compressed string
      if (preferences.feedFilters.hideFromUsers && preferences.feedFilters.hideFromUsers.length > 0) {
        const compressedUsers = compressArray(preferences.feedFilters.hideFromUsers);
        const usersSuccess = safeLocalStorageSave(STORAGE_KEYS.HIDDEN_USERS, compressedUsers);
        if (!usersSuccess) anySaveFailed = true;
      }
      
      // Save each section separately
      const contentSuccess = safeLocalStorageSave(STORAGE_KEYS.CONTENT_PREFS, preferences.contentPreferences);
      if (!contentSuccess) anySaveFailed = true;
      
      const notifSuccess = safeLocalStorageSave(STORAGE_KEYS.NOTIFICATION_PREFS, preferences.notificationPreferences);
      if (!notifSuccess) anySaveFailed = true;
      
      const relaySuccess = safeLocalStorageSave(STORAGE_KEYS.RELAY_PREFS, preferences.relayPreferences);
      if (!relaySuccess) anySaveFailed = true;
      
      const uiSuccess = safeLocalStorageSave(STORAGE_KEYS.UI_PREFS, preferences.uiPreferences);
      if (!uiSuccess) anySaveFailed = true;

      // Update storage quota reached state
      if (anySaveFailed && !storageQuotaReached) {
        setStorageQuotaReached(true);
        toast.error("Storage limit reached", {
          description: "Some preferences may not be saved between sessions.",
          duration: 5000
        });
      } else if (!anySaveFailed && storageQuotaReached) {
        // Storage working again, update status
        setStorageQuotaReached(false);
        safeLocalStorageSave(STORAGE_KEYS.STORAGE_STATUS, 'ok');
      }
    }
  }, [preferences, loaded, storageAvailable, storageQuotaReached]);

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
    
    // Clear all preference keys from storage
    if (storageAvailable) {
      Object.values(STORAGE_KEYS).forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error(`Failed to remove key ${key}:`, e);
        }
      });
    }
    
    toast.success("Preferences reset to defaults");
  }, [storageAvailable]);

  return {
    preferences,
    updatePreference,
    updateNestedPreference,
    resetPreferences,
    loaded,
    storageAvailable,
    storageQuotaReached
  };
}
