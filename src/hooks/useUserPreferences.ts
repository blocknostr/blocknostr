
import { useState, useEffect, useCallback } from 'react';

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
  },
};

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loaded, setLoaded] = useState(false);

  // Load preferences from localStorage
  useEffect(() => {
    const storedPrefs = localStorage.getItem('blocknoster_preferences');
    if (storedPrefs) {
      try {
        // Parse stored preferences
        const parsedPrefs = JSON.parse(storedPrefs);
        
        // Type check: ensure parsedPrefs is a valid object
        if (parsedPrefs && typeof parsedPrefs === 'object' && !Array.isArray(parsedPrefs)) {
          // Merge with defaults to ensure any new preferences are included
          // Fix: explicitly create a new preferences object without using spread on parsedPrefs
          const mergedPreferences: UserPreferences = {
            ...defaultPreferences,
            defaultFeed: parsedPrefs.defaultFeed || defaultPreferences.defaultFeed,
            feedFilters: {
              ...defaultPreferences.feedFilters,
              ...(parsedPrefs.feedFilters && typeof parsedPrefs.feedFilters === 'object' ? parsedPrefs.feedFilters : {}),
            },
            contentPreferences: {
              ...defaultPreferences.contentPreferences,
              ...(parsedPrefs.contentPreferences && typeof parsedPrefs.contentPreferences === 'object' ? parsedPrefs.contentPreferences : {}),
            },
            notificationPreferences: {
              ...defaultPreferences.notificationPreferences,
              ...(parsedPrefs.notificationPreferences && typeof parsedPrefs.notificationPreferences === 'object' ? parsedPrefs.notificationPreferences : {}),
            },
            relayPreferences: {
              ...defaultPreferences.relayPreferences,
              ...(parsedPrefs.relayPreferences && typeof parsedPrefs.relayPreferences === 'object' ? parsedPrefs.relayPreferences : {}),
            },
            uiPreferences: {
              ...defaultPreferences.uiPreferences,
              ...(parsedPrefs.uiPreferences && typeof parsedPrefs.uiPreferences === 'object' ? parsedPrefs.uiPreferences : {}),
            },
          };
          
          setPreferences(mergedPreferences);
        } else {
          console.error('Stored preferences is not a valid object:', parsedPrefs);
          // Use default preferences if stored data is invalid
          setPreferences(defaultPreferences);
        }
      } catch (e) {
        console.error('Failed to parse preferences:', e);
        // Use default preferences in case of parsing error
        setPreferences(defaultPreferences);
      }
    }
    setLoaded(true);
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (loaded) {
      localStorage.setItem('blocknoster_preferences', JSON.stringify(preferences));
    }
  }, [preferences, loaded]);

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
      
      // Fix: The issue is here - nestedObject might not be typed correctly for spreading
      // Instead of spreading directly, we'll create a proper typed object
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
      return {
        ...prev,
        [key]: {
          ...defaultPreferences[key],
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
    loaded
  };
}
