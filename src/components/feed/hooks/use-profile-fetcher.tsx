
import { useState, useCallback } from "react";
import { contentCache } from "@/lib/nostr";
import { ProfileUtils } from "@/lib/nostr/utils/profileUtils";

export function useProfileFetcher() {
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loadingProfiles, setLoadingProfiles] = useState<Record<string, boolean>>({});
  
  const fetchProfileData = useCallback(async (pubkey: string) => {
    if (!pubkey || profiles[pubkey]) return;
    
    // Set loading state for this profile
    setLoadingProfiles(prev => ({
      ...prev,
      [pubkey]: true
    }));
    
    try {
      // Use our enhanced ProfileUtils
      const profile = await ProfileUtils.fetchProfile(pubkey);
      
      if (profile) {
        setProfiles(prev => ({
          ...prev,
          [pubkey]: profile
        }));
      }
    } catch (error) {
      console.error(`Error fetching profile for ${pubkey}:`, error);
    } finally {
      setLoadingProfiles(prev => ({
        ...prev,
        [pubkey]: false
      }));
    }
  }, [profiles]);
  
  const prefetchProfiles = useCallback((pubkeys: string[]) => {
    // Prefetch multiple profiles in batches
    const uniquePubkeys = [...new Set(pubkeys)].filter(
      pubkey => !profiles[pubkey] && !loadingProfiles[pubkey]
    );
    
    // Process in batches of 5 to avoid overwhelming the system
    for (let i = 0; i < uniquePubkeys.length; i += 5) {
      const batch = uniquePubkeys.slice(i, i + 5);
      batch.forEach(pubkey => {
        fetchProfileData(pubkey);
      });
    }
  }, [profiles, loadingProfiles, fetchProfileData]);
  
  return {
    profiles,
    loadingProfiles,
    fetchProfileData,
    prefetchProfiles
  };
}
