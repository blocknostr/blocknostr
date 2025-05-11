
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
        // Parse stored preferences and ensure it's treated as an object
        const parsedPrefs = JSON.parse(storedPrefs);
        
        // Verify that parsedPrefs is an object before spreading
        if (parsedPrefs && typeof parsedPrefs === 'object' && !Array.isArray(parsedPrefs)) {
          // Merge with defaults to ensure any new preferences are included
          setPreferences({
            ...defaultPreferences,
            ...parsedPrefs as Partial<UserPreferences>
          });
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
    setPreferences(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [nestedKey]: value,
      },
    }));
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
