
import { useState, useCallback } from "react";
import { nostrService } from "@/lib/nostr";

/**
 * Hook to handle fetching and caching profile information
 */
export const useProfileFetcher = () => {
  const [profiles, setProfiles] = useState<Record<string, any>>({});

  // Fetch profile info with error handling
  const fetchProfile = useCallback(async (pubkey: string) => {
    if (!pubkey || profiles[pubkey]) return;
    
    try {
      const profile = await nostrService.getUserProfile(pubkey);
      if (profile) {
        setProfiles(prev => ({
          ...prev,
          [pubkey]: profile
        }));
      }
    } catch (error) {
      console.error(`Error fetching profile for ${pubkey}:`, error);
    }
  }, [profiles]);

  return {
    profiles,
    fetchProfile
  };
};
