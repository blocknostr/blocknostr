
import { useState, useEffect } from 'react';
import { useUserPreferences } from './useUserPreferences';

interface MediaPreferences {
  autoPlayVideos: boolean;
  autoLoadImages: boolean;
  dataSaverMode: boolean;
  preferredQuality: 'high' | 'medium' | 'low';
}

export function useMediaPreferences() {
  const { preferences, updateNestedPreference, storageQuotaReached } = useUserPreferences();
  const [mediaPrefs, setMediaPrefs] = useState<MediaPreferences>({
    autoPlayVideos: preferences.contentPreferences?.showMediaByDefault ?? true,
    autoLoadImages: preferences.contentPreferences?.showPreviewImages ?? true,
    dataSaverMode: preferences.contentPreferences?.dataSaverMode ?? false,
    preferredQuality: preferences.contentPreferences?.preferredQuality as 'high' | 'medium' | 'low' || 'high'
  });

  // Effect to sync with user preferences
  useEffect(() => {
    setMediaPrefs({
      autoPlayVideos: preferences.contentPreferences?.showMediaByDefault ?? true,
      autoLoadImages: preferences.contentPreferences?.showPreviewImages ?? true,
      dataSaverMode: preferences.contentPreferences?.dataSaverMode ?? false,
      preferredQuality: preferences.contentPreferences?.preferredQuality as 'high' | 'medium' | 'low' || 'high'
    });
  }, [preferences.contentPreferences]);

  // Update user preferences when mediaPrefs change
  const updateMediaPreference = <K extends keyof MediaPreferences>(
    key: K,
    value: MediaPreferences[K]
  ) => {
    // If storage quota is reached, update the local state only
    if (storageQuotaReached) {
      setMediaPrefs(prev => ({
        ...prev,
        [key]: value
      }));
      return;
    }
    
    // Map our internal keys to user preferences keys
    const preferencesKeyMap: Record<keyof MediaPreferences, string> = {
      autoPlayVideos: 'showMediaByDefault',
      autoLoadImages: 'showPreviewImages',
      dataSaverMode: 'dataSaverMode',
      preferredQuality: 'preferredQuality'
    };
    
    // Update the user preferences
    updateNestedPreference(
      'contentPreferences',
      preferencesKeyMap[key] as any,
      value
    );
  };

  return { 
    mediaPrefs, 
    updateMediaPreference
  };
}

