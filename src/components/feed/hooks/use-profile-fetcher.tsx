
import * as React from "react";
import { unifiedProfileService } from "@/lib/services/UnifiedProfileService";

export function useProfileFetcher() {
  const [profiles, setProfiles] = React.useState<Record<string, any>>({});
  const [fetchErrors, setFetchErrors] = React.useState<Record<string, string>>({});
  
  const fetchProfileData = React.useCallback(async (pubkey: string) => {
    if (!pubkey) {
      console.warn("[useProfileFetcher] No pubkey provided");
      return;
    }
    
    if (profiles[pubkey]) {
      console.log(`[useProfileFetcher] Profile already loaded for ${pubkey.substring(0, 8)}`);
      return;
    }
    
    console.log(`[useProfileFetcher] Fetching profile for ${pubkey.substring(0, 8)}`);
    
    try {
      // Use our unified profile service
      const data = await unifiedProfileService.getProfile(pubkey);
      
      if (data) {
        console.log(`[useProfileFetcher] Profile loaded for ${pubkey.substring(0, 8)}: ${data.name || data.display_name || 'No name'}`);
        
        setProfiles(prev => ({
          ...prev,
          [pubkey]: data
        }));
        
        // Clear any previous errors
        if (fetchErrors[pubkey]) {
          setFetchErrors(prev => {
            const newErrors = {...prev};
            delete newErrors[pubkey];
            return newErrors;
          });
        }
      } else {
        console.warn(`[useProfileFetcher] No profile data returned for ${pubkey.substring(0, 8)}`);
        setFetchErrors(prev => ({
          ...prev,
          [pubkey]: "No profile data found"
        }));
      }
    } catch (error) {
      console.error(`[useProfileFetcher] Error fetching profile for ${pubkey.substring(0, 8)}:`, error);
      setFetchErrors(prev => ({
        ...prev,
        [pubkey]: error instanceof Error ? error.message : "Unknown error"
      }));
    }
  }, [profiles, fetchErrors]);
  
  // Subscribe to profile updates from the unified service
  React.useEffect(() => {
    const eventHandlers: (() => void)[] = [];
    
    // Get all pubkeys we're tracking
    const trackedPubkeys = Object.keys(profiles);
    
    trackedPubkeys.forEach(pubkey => {
      const unsubscribe = unifiedProfileService.subscribeToUpdates(pubkey, (profile) => {
        console.log(`[useProfileFetcher] Profile update received for ${pubkey.substring(0, 8)}`, profile?.name || profile?.display_name);
        
        setProfiles(prev => ({
          ...prev,
          [pubkey]: profile
        }));
      });
      
      eventHandlers.push(unsubscribe);
    });
    
    return () => {
      // Cleanup all subscriptions
      eventHandlers.forEach(unsubscribe => unsubscribe());
    };
  }, [profiles]);
  
  return {
    profiles,
    fetchProfileData,
    fetchErrors
  };
}
