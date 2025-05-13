
import * as React from "react";
import { contentCache, nostrService } from "@/lib/nostr";

export function useProfileFetcher() {
  const [profiles, setProfiles] = React.useState<Record<string, any>>({});
  
  const fetchProfileData = React.useCallback(async (pubkey: string) => {
    if (!pubkey || profiles[pubkey]) return;
    
    // Check cache first
    const cachedProfile = contentCache.getProfile(pubkey);
    if (cachedProfile) {
      setProfiles(prev => ({
        ...prev,
        [pubkey]: cachedProfile
      }));
      return;
    }
    
    try {
      const profile = await nostrService.getUserProfile(pubkey);
      if (profile) {
        setProfiles(prev => ({
          ...prev,
          [pubkey]: profile
        }));
        
        // Cache the profile
        contentCache.cacheProfile(pubkey, profile);
      }
    } catch (error) {
      console.error(`Error fetching profile for ${pubkey}:`, error);
    }
  }, [profiles]);
  
  return {
    profiles,
    fetchProfileData
  };
}
