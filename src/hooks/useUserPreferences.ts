
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { safeLocalStorageGet, safeLocalStorageSet, safeLocalStorageGetJson, safeLocalStorageSetJson } from '@/lib/utils/storage';

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
  STORAGE_STATUS: 'bn_storage_status',
  STORAGE_TEST: 'bn_storage_test'
};

// Compress arrays by joining with delimiter 
const compressArray = (array: string[]): string => {
  return array.join('|');
};

// Decompress string back to array
const decompressArray = (compressed: string): string[] => {
  return compressed ? compressed.split('|') : [];
};

// In-memory fallback when localStorage is unavailable
const memoryStore = new Map<string, string>();

// Test if storage is available and has sufficient quota
const testStorageAvailability = (): { available: boolean, quotaReached: boolean } => {
  try {
    localStorage.setItem(STORAGE_KEYS.STORAGE_TEST, 'test');
    localStorage.removeItem(STORAGE_KEYS.STORAGE_TEST);
    
    // Check if we previously had storage issues
    let storageStatus = '';
    try {
      storageStatus = localStorage.getItem(STORAGE_KEYS.STORAGE_STATUS) || '';
    } catch (e) {
      storageStatus = memoryStore.get(STORAGE_KEYS.STORAGE_STATUS) || '';
    }
    
    return { 
      available: true, 
      quotaReached: storageStatus === 'limited'
    };
  } catch (e) {
    console.error('Storage availability test failed:', e);
    return { 
      available: false, 
      quotaReached: true
    };
  }
};

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loaded, setLoaded] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [storageQuotaReached, setStorageQuotaReached] = useState(false);

  // Test if localStorage is available
  useEffect(() => {
    const { available, quotaReached } = testStorageAvailability();
    setStorageAvailable(available);
    setStorageQuotaReached(quotaReached);
    
    if (!available) {
      console.warn("Storage is unavailable. Using in-memory storage only.");
    }
    if (quotaReached) {
      console.warn("Storage quota has been reached. Some preferences may not persist.");
    }
  }, []);

  // Load preferences from storage with chunked storage
  useEffect(() => {
    try {
      // Load individual preference sections
      // Use JSON parsing for all values to ensure proper handling
      const defaultFeedRaw = safeLocalStorageGet(STORAGE_KEYS.DEFAULT_FEED);
      let defaultFeed: FeedType = defaultPreferences.defaultFeed;
      
      if (defaultFeedRaw) {
        try {
          const parsed = JSON.parse(`"${defaultFeedRaw}"`); // Wrap in quotes to handle string values
          if (parsed === "global" || parsed === "following" || parsed === "for-you" || parsed === "media") {
            defaultFeed = parsed;
          }
        } catch (e) {
          console.warn(`Invalid default feed value: ${defaultFeedRaw}, using default`);
          // Fix the broken value by saving the correct JSON
          safeLocalStorageSetJson(STORAGE_KEYS.DEFAULT_FEED, defaultPreferences.defaultFeed);
        }
      }
      
      // Load feed filters except hidden users (which we'll handle separately)
      const feedFilters = safeLocalStorageGetJson(STORAGE_KEYS.FEED_FILTERS) || {
        showReplies: defaultPreferences.feedFilters.showReplies,
        showReposted: defaultPreferences.feedFilters.showReposted,
      };
      
      // Load hidden users array separately (could be large)
      let hideFromUsers: string[] = [];
      try {
        const compressedUsers = safeLocalStorageGet(STORAGE_KEYS.HIDDEN_USERS) || '';
        hideFromUsers = decompressArray(compressedUsers);
      } catch (e) {
        console.error('Failed to load hidden users:', e);
        hideFromUsers = [];
      }
      
      const contentPreferences = safeLocalStorageGetJson(STORAGE_KEYS.CONTENT_PREFS) || defaultPreferences.contentPreferences;
      const notificationPreferences = safeLocalStorageGetJson(STORAGE_KEYS.NOTIFICATION_PREFS) || defaultPreferences.notificationPreferences;
      const relayPreferences = safeLocalStorageGetJson(STORAGE_KEYS.RELAY_PREFS) || defaultPreferences.relayPreferences;
      const uiPreferences = safeLocalStorageGetJson(STORAGE_KEYS.UI_PREFS) || defaultPreferences.uiPreferences;
      
      // Merge all preferences with defaults for any missing properties
      const mergedPreferences: UserPreferences = {
        ...defaultPreferences,
        defaultFeed,
        feedFilters: {
          ...defaultPreferences.feedFilters,
          ...feedFilters,
          hideFromUsers,
        },
        contentPreferences: {
          ...defaultPreferences.contentPreferences,
          ...contentPreferences
        },
        notificationPreferences: {
          ...defaultPreferences.notificationPreferences,
          ...notificationPreferences
        },
        relayPreferences: {
          ...defaultPreferences.relayPreferences,
          ...relayPreferences
        },
        uiPreferences: {
          ...defaultPreferences.uiPreferences,
          ...uiPreferences
        }
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
    if (loaded) {
      // Track if any saves failed
      let anySaveFailed = false;
      
      // Save default feed - always use JSON stringify now
      const feedSuccess = safeLocalStorageSetJson(STORAGE_KEYS.DEFAULT_FEED, preferences.defaultFeed);
      if (!feedSuccess) anySaveFailed = true;
      
      // Save feed filters without the potentially large hideFromUsers array
      const feedFilters = {
        showReplies: preferences.feedFilters.showReplies,
        showReposted: preferences.feedFilters.showReposted
      };
      const filtersSuccess = safeLocalStorageSetJson(STORAGE_KEYS.FEED_FILTERS, feedFilters);
      if (!filtersSuccess) anySaveFailed = true;
      
      // Save hidden users as compressed string
      if (preferences.feedFilters.hideFromUsers && preferences.feedFilters.hideFromUsers.length > 0) {
        const compressedUsers = compressArray(preferences.feedFilters.hideFromUsers);
        const usersSuccess = safeLocalStorageSet(STORAGE_KEYS.HIDDEN_USERS, compressedUsers);
        if (!usersSuccess) anySaveFailed = true;
      }
      
      // Save each section separately
      const contentSuccess = safeLocalStorageSetJson(STORAGE_KEYS.CONTENT_PREFS, preferences.contentPreferences);
      if (!contentSuccess) anySaveFailed = true;
      
      const notifSuccess = safeLocalStorageSetJson(STORAGE_KEYS.NOTIFICATION_PREFS, preferences.notificationPreferences);
      if (!notifSuccess) anySaveFailed = true;
      
      const relaySuccess = safeLocalStorageSetJson(STORAGE_KEYS.RELAY_PREFS, preferences.relayPreferences);
      if (!relaySuccess) anySaveFailed = true;
      
      const uiSuccess = safeLocalStorageSetJson(STORAGE_KEYS.UI_PREFS, preferences.uiPreferences);
      if (!uiSuccess) anySaveFailed = true;

      // Update storage quota reached state
      if (anySaveFailed && !storageQuotaReached) {
        setStorageQuotaReached(true);
        
        // Only show toast first time we detect the issue
        toast.warning(
          "Storage limit reached", 
          { 
            description: "Some preferences will only be available for this session.",
            duration: 5000
          }
        );
      } else if (!anySaveFailed && storageQuotaReached) {
        // Storage working again, update status
        setStorageQuotaReached(false);
        safeLocalStorageSet(STORAGE_KEYS.STORAGE_STATUS, 'ok');
      }
    }
  }, [preferences, loaded, storageQuotaReached]);

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
          memoryStore.delete(key);
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
