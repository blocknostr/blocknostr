
import * as React from "react";
import { profileDataService } from "@/lib/services/ProfileDataService";
import { cacheManager } from "@/lib/utils/cacheManager";
import { toast } from "sonner";

export function useProfileFetcher() {
  const [profiles, setProfiles] = React.useState<Record<string, any>>({});
  const [fetchErrors, setFetchErrors] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState<Record<string, boolean>>({});
  const processedPubkeys = React.useRef(new Set<string>());
  
  const fetchProfileData = React.useCallback(async (pubkey: string) => {
    if (!pubkey) {
      console.warn("useProfileFetcher: No pubkey provided");
      return;
    }
    
    // Don't refetch if already in process or completed
    if (processedPubkeys.current.has(pubkey) || loading[pubkey]) {
      return;
    }
    
    // Mark this pubkey as processed to prevent duplicate requests
    processedPubkeys.current.add(pubkey);
    
    // Check cache first
    const cacheKey = `profile:${pubkey}`;
    const cachedProfile = cacheManager.get(cacheKey);
    
    if (cachedProfile) {
      console.log("useProfileFetcher: Using cached profile for:", pubkey);
      setProfiles(prev => ({
        ...prev,
        [pubkey]: cachedProfile
      }));
      return;
    }
    
    // Set loading state
    setLoading(prev => ({ ...prev, [pubkey]: true }));
    console.log("useProfileFetcher: Fetching profile for:", pubkey);
    
    try {
      // This will trigger the profile data service to load the data
      const data = await profileDataService.loadProfileData(pubkey, null);
      
      if (data && data.metadata) {
        console.log("useProfileFetcher: Profile loaded:", data.metadata.name || data.metadata.display_name || pubkey);
        
        // Update profiles state
        setProfiles(prev => ({
          ...prev,
          [pubkey]: data.metadata
        }));
        
        // Cache the result (30 min TTL)
        cacheManager.set(cacheKey, data.metadata, 30 * 60 * 1000);
        
        // Clear any previous errors
        if (fetchErrors[pubkey]) {
          setFetchErrors(prev => {
            const newErrors = {...prev};
            delete newErrors[pubkey];
            return newErrors;
          });
        }
      } else {
        console.warn("useProfileFetcher: No metadata returned for:", pubkey);
        setFetchErrors(prev => ({
          ...prev,
          [pubkey]: "No profile data found"
        }));
      }
    } catch (error) {
      console.error(`Error fetching profile for ${pubkey}:`, error);
      setFetchErrors(prev => ({
        ...prev,
        [pubkey]: error instanceof Error ? error.message : "Unknown error"
      }));
      
      // Retry once after a short delay for transient errors
      setTimeout(() => {
        // Only retry if we're still mounted and have the error
        if (processedPubkeys.current.has(pubkey) && fetchErrors[pubkey]) {
          processedPubkeys.current.delete(pubkey);
          fetchProfileData(pubkey).catch(console.error);
        }
      }, 3000);
    } finally {
      setLoading(prev => ({ ...prev, [pubkey]: false }));
    }
  }, [profiles, fetchErrors, loading]);
  
  // New method to fetch multiple profiles at once
  const fetchMultipleProfiles = React.useCallback(async (pubkeys: string[]) => {
    if (!pubkeys || !pubkeys.length) return;
    
    // Filter out already processed pubkeys
    const newPubkeys = pubkeys.filter(key => !processedPubkeys.current.has(key));
    
    // Process in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < newPubkeys.length; i += batchSize) {
      const batch = newPubkeys.slice(i, i + batchSize);
      await Promise.all(batch.map(pubkey => fetchProfileData(pubkey)));
      
      // Small delay between batches
      if (i + batchSize < newPubkeys.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  }, [fetchProfileData]);
  
  // Reset the processed set when dependencies change
  React.useEffect(() => {
    return () => {
      processedPubkeys.current.clear();
    };
  }, []);
  
  return {
    profiles,
    fetchProfileData,
    fetchMultipleProfiles,
    fetchErrors,
    loading
  };
}
