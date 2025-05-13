
import { useState, useCallback, useRef } from "react";
import { nostrService } from "@/lib/nostr";
import { cacheManager } from "@/lib/utils/cacheManager";

/**
 * Hook to handle fetching and caching profile information
 */
export const useProfileFetcher = () => {
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const processedPubkeys = useRef(new Set<string>());

  // Fetch profile info with error handling and caching
  const fetchProfile = useCallback(async (pubkey: string) => {
    if (!pubkey || loading[pubkey] || processedPubkeys.current.has(pubkey)) return;
    
    // Mark this pubkey as processed
    processedPubkeys.current.add(pubkey);
    
    // Check cache first
    const cacheKey = `profile:${pubkey}`;
    const cachedProfile = cacheManager.get(cacheKey);
    
    if (cachedProfile) {
      setProfiles(prev => ({
        ...prev,
        [pubkey]: cachedProfile
      }));
      return;
    }
    
    // Set loading state
    setLoading(prev => ({ ...prev, [pubkey]: true }));
    
    try {
      const profile = await nostrService.getUserProfile(pubkey);
      if (profile) {
        setProfiles(prev => ({
          ...prev,
          [pubkey]: profile
        }));
        
        // Cache the result (30 min TTL)
        cacheManager.set(cacheKey, profile, 30 * 60 * 1000);
      }
    } catch (error) {
      console.error(`Error fetching profile for ${pubkey}:`, error);
      
      // Retry once after a short delay for transient errors
      setTimeout(() => {
        if (processedPubkeys.current.has(pubkey)) {
          processedPubkeys.current.delete(pubkey);
          fetchProfile(pubkey).catch(console.error);
        }
      }, 3000);
    } finally {
      setLoading(prev => ({ ...prev, [pubkey]: false }));
    }
  }, [loading]);
  
  // Batch fetch profiles
  const fetchMultipleProfiles = useCallback(async (pubkeys: string[]) => {
    if (!pubkeys || !pubkeys.length) return;
    
    // Filter out already processed pubkeys
    const newPubkeys = pubkeys.filter(key => !processedPubkeys.current.has(key));
    
    // Process in batches
    const batchSize = 5;
    for (let i = 0; i < newPubkeys.length; i += batchSize) {
      const batch = newPubkeys.slice(i, i + batchSize);
      await Promise.all(batch.map(pubkey => fetchProfile(pubkey)));
      
      if (i + batchSize < newPubkeys.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  }, [fetchProfile]);

  return {
    profiles,
    fetchProfile,
    fetchMultipleProfiles,
    loading
  };
};
