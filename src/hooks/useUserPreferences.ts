
import * as React from 'react';
import { toast } from 'sonner';

export type FeedType = 'global' | 'following' | 'media';

export interface UserPreferences {
  defaultFeed: FeedType;
  feedFilters: {
    showReplies: boolean;
    showReposted: boolean;
    hideFromUsers: string[]; // pubkeys to hide
    globalFeedTags: string[]; // Default hashtags for global feed
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
    globalFeedTags: ['bitcoin', 'nostr', 'alephium'], // Default hashtags
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
  GLOBAL_FEED_TAGS: 'bn_pref_global_tags',
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

// Safely save to localStorage with error handling and memory fallback
const safeLocalStorageSave = (key: string, value: any): boolean => {
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);

    // First try browser localStorage
    try {
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      // If localStorage fails, use memory storage as fallback
      console.warn(`Using memory storage for key (${key}) due to: ${error}`);
      memoryStore.set(key, serialized);

      // Mark storage as problematic
      memoryStore.set(STORAGE_KEYS.STORAGE_STATUS, 'limited');
      return false;
    }
  } catch (error) {
    console.error(`Failed to serialize or save value (${key}):`, error);
    return false;
  }
};

// Safely load from storage with fallback to memory store
const safeStorageLoad = <T>(key: string, defaultValue: T): T => {
  try {
    // Try localStorage first
    let serialized: string | null = null;
    try {
      serialized = localStorage.getItem(key);
    } catch (e) {
      // If localStorage fails, try memory storage
      console.warn(`Using memory storage for reading key (${key}) due to: ${e}`);
      serialized = memoryStore.get(key) || null;
    }
    if (serialized === null) return defaultValue;

    // If the value is a compressed array (starts with pipe or alphanumeric)
    if (typeof defaultValue === 'object' && Array.isArray(defaultValue) &&
      (typeof serialized === 'string' && /^[a-zA-Z0-9|]+$/.test(serialized))) {
      return decompressArray(serialized) as unknown as T;
    }

    // --- PATCH: Handle legacy non-JSON values (e.g. "global") gracefully ---
    try {
      return JSON.parse(serialized) as T;
    } catch (err) {
      // If parsing fails, return the raw string if it matches the expected type
      if (typeof defaultValue === 'string') {
        return serialized as unknown as T;
      }
      // If FeedType (for defaultFeed), allow 'global', 'following', etc.
      if (
        key === STORAGE_KEYS.DEFAULT_FEED &&
        (serialized === 'global' || serialized === 'following' || serialized === 'media')
      ) {
        return serialized as unknown as T;
      }
      // Otherwise, fallback to default
      return defaultValue;
    }
    // --- END PATCH ---
  } catch (error) {
    console.error(`Failed to load from storage (${key}):`, error);
    return defaultValue;
  }
};

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
  const [preferences, setPreferences] = React.useState<UserPreferences>(defaultPreferences);
  const [loaded, setLoaded] = React.useState(false);
  const [storageAvailable, setStorageAvailable] = React.useState(true);
  const [storageQuotaReached, setStorageQuotaReached] = React.useState(false);

  // Test if localStorage is available
  React.useEffect(() => {
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
  React.useEffect(() => {
    try {
      // Load individual preference sections
      const defaultFeed = safeStorageLoad<FeedType>(STORAGE_KEYS.DEFAULT_FEED, defaultPreferences.defaultFeed);

      // Check if the loaded default feed is still valid after removing 'for-you'
      const validFeed = defaultFeed === 'global' || defaultFeed === 'following' || defaultFeed === 'media' 
        ? defaultFeed 
        : 'global';

      // Load feed filters except hidden users (which we'll handle separately)
      const feedFilters = safeStorageLoad(STORAGE_KEYS.FEED_FILTERS, {
        showReplies: defaultPreferences.feedFilters.showReplies,
        showReposted: defaultPreferences.feedFilters.showReposted,
      });

      // Load hidden users array separately (could be large)
      let hideFromUsers: string[] = [];
      try {
        const compressedUsers = safeStorageLoad<string>(STORAGE_KEYS.HIDDEN_USERS, '');
        hideFromUsers = decompressArray(compressedUsers);
      } catch (e) {
        console.error('Failed to load hidden users:', e);
        hideFromUsers = [];
      }
      
      // Load global feed tags
      let globalFeedTags: string[] = defaultPreferences.feedFilters.globalFeedTags;
      try {
        const compressedTags = safeStorageLoad<string>(STORAGE_KEYS.GLOBAL_FEED_TAGS, '');
        if (compressedTags) {
          globalFeedTags = decompressArray(compressedTags);
        }
      } catch (e) {
        console.error('Failed to load global feed tags:', e);
      }

      const contentPreferences = safeStorageLoad(STORAGE_KEYS.CONTENT_PREFS, defaultPreferences.contentPreferences);
      const notificationPreferences = safeStorageLoad(STORAGE_KEYS.NOTIFICATION_PREFS, defaultPreferences.notificationPreferences);
      const relayPreferences = safeStorageLoad(STORAGE_KEYS.RELAY_PREFS, defaultPreferences.relayPreferences);
      const uiPreferences = safeStorageLoad(STORAGE_KEYS.UI_PREFS, defaultPreferences.uiPreferences);

      // Merge all preferences with defaults for any missing properties
      const mergedPreferences: UserPreferences = {
        ...defaultPreferences,
        defaultFeed: validFeed,
        feedFilters: {
          ...defaultPreferences.feedFilters,
          ...feedFilters,
          hideFromUsers,
          globalFeedTags,
        },
        contentPreferences,
        notificationPreferences,
        relayPreferences,
        uiPreferences
      };

      setPreferences(mergedPreferences);

      // Clean up old 'for-you' interaction data if it exists
      try {
        localStorage.removeItem('nostr_interaction_weights');
      } catch (e) {
        // Ignore errors when cleaning up
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      // Fall back to defaults
      setPreferences(defaultPreferences);
    }

    setLoaded(true);
  }, [storageAvailable]);

  // Save preferences to localStorage with chunking to avoid quota issues
  React.useEffect(() => {
    if (loaded) {
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

      // Save global feed tags as compressed string
      if (preferences.feedFilters.globalFeedTags && preferences.feedFilters.globalFeedTags.length > 0) {
        const compressedTags = compressArray(preferences.feedFilters.globalFeedTags);
        const tagsSuccess = safeLocalStorageSave(STORAGE_KEYS.GLOBAL_FEED_TAGS, compressedTags);
        if (!tagsSuccess) anySaveFailed = true;
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
        safeLocalStorageSave(STORAGE_KEYS.STORAGE_STATUS, 'ok');
      }
    }
  }, [preferences, loaded, storageQuotaReached]);

  // Update specific preference
  const updatePreference = React.useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Update nested preference - FIXING THE SYNTAX ISSUE HERE
  const updateNestedPreference = React.useCallback(<
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
  const resetPreferences = React.useCallback(() => {
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
