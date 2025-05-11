
import { useState, useCallback } from "react";

export const useProfileFetcher = () => {
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  
  const fetchProfile = useCallback(async (
    pubkey: string,
    getUserProfile: (pubkey: string) => Promise<any>
  ) => {
    if (!pubkey || profiles[pubkey]) return;
    
    try {
      const profile = await getUserProfile(pubkey);
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
