
import { useState, useCallback, useRef } from "react";
import { nostrService } from "@/lib/nostr";

export function useProfileFetcher(initialProfiles = {}) {
  const [profiles, setProfiles] = useState<Record<string, any>>(initialProfiles);
  const fetchingRef = useRef<Set<string>>(new Set());
  
  const fetchProfileData = useCallback(async (pubkey: string) => {
    // Skip if we're already fetching this profile
    if (fetchingRef.current.has(pubkey)) return;
    
    // Skip if we already have this profile
    if (profiles[pubkey]) return;
    
    // Mark as fetching
    fetchingRef.current.add(pubkey);
    
    try {
      const profileData = await nostrService.getProfileData(pubkey);
      if (profileData) {
        setProfiles(prev => ({
          ...prev,
          [pubkey]: profileData
        }));
      }
    } catch (err) {
      console.error(`Error fetching profile for ${pubkey}:`, err);
    } finally {
      // Remove from fetching set when done
      fetchingRef.current.delete(pubkey);
    }
  }, [profiles]);
  
  return { profiles, fetchProfileData, setProfiles };
}
