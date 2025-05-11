
import { useState } from "react";
import { contentCache, nostrService } from "@/lib/nostr";

export function useProfileFetcher() {
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  
  const fetchProfileData = async (pubkey: string) => {
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
  };
  
  return {
    profiles,
    fetchProfileData
  };
}
