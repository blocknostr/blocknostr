import * as React from "react";
import { unifiedProfileService } from "@/lib/services/UnifiedProfileService";
import { nostrService } from "@/lib/nostr";
import { eventBus, EVENTS } from "@/lib/services/EventBus";
import { SubscriptionTracker } from "@/lib/nostr/subscription-tracker";
import { v4 as uuidv4 } from 'uuid';

/**
 * Unified hook for fetching and managing profile data across components
 */
export function useUnifiedProfileFetcher() {
  const [profiles, setProfiles] = React.useState<Record<string, any>>({});
  const [fetchErrors, setFetchErrors] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState<Record<string, boolean>>({});
  
  // Use a ref for active subscriptions to prevent memory leaks
  const activeSubscriptions = React.useRef<Record<string, () => void>>({});
  
  // Generate a component ID for subscription tracking
  const componentId = React.useRef<string>(`profile_fetcher_${uuidv4().slice(0, 8)}`).current;
  
  // Clean up subscriptions when the component unmounts
  React.useEffect(() => {
    return () => {
      // Execute local cleanup functions
      Object.values(activeSubscriptions.current).forEach(unsubscribe => {
        if (unsubscribe) {
          try {
            unsubscribe();
          } catch (error) {
            console.error("Error unsubscribing:", error);
          }
        }
      });
      
      // Also clean up via the global tracker as a safety measure
      const tracker = SubscriptionTracker.getInstance();
      tracker.cleanupForComponent(componentId);
    };
  }, [componentId]);
  
  /**
   * Fetch a single profile
   */
  const fetchProfile = React.useCallback(async (pubkey: string, options: { force?: boolean } = {}) => {
    if (!pubkey) return null;
    
    // Mark as loading
    setLoading(prev => ({ ...prev, [pubkey]: true }));
    
    try {
      console.log(`[useUnifiedProfileFetcher] Fetching profile for ${pubkey.substring(0, 8)}`);
      const profile = await unifiedProfileService.getProfile(pubkey, options);
      
      if (profile) {
        // Update state with the new profile
        setProfiles(prev => ({ ...prev, [pubkey]: profile }));
        
        // Clear any previous errors
        if (fetchErrors[pubkey]) {
          setFetchErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[pubkey];
            return newErrors;
          });
        }
        
        // Set up subscription for updates if not already subscribed
        if (!activeSubscriptions.current[pubkey]) {
          activeSubscriptions.current[pubkey] = unifiedProfileService.subscribeToUpdates(pubkey, (updatedProfile) => {
            if (updatedProfile) {
              console.log(`[useUnifiedProfileFetcher] Received profile update for ${pubkey.substring(0, 8)}`, 
                updatedProfile.name || updatedProfile.display_name);
              setProfiles(prev => ({ ...prev, [pubkey]: updatedProfile }));
            }
          });
          
          // Register with the tracker for safety
          const tracker = SubscriptionTracker.getInstance();
          tracker.register(`profile_sub_${pubkey}`, activeSubscriptions.current[pubkey], componentId);
        }
        
        return profile;
      } else {
        console.warn(`[useUnifiedProfileFetcher] No profile data returned for ${pubkey.substring(0, 8)}`);
        setFetchErrors(prev => ({
          ...prev,
          [pubkey]: "No profile data found"
        }));
        return null;
      }
    } catch (error) {
      console.error(`[useUnifiedProfileFetcher] Error fetching profile for ${pubkey.substring(0, 8)}:`, error);
      setFetchErrors(prev => ({
        ...prev,
        [pubkey]: error instanceof Error ? error.message : "Unknown error"
      }));
      return null;
    } finally {
      // Mark as no longer loading
      setLoading(prev => ({ ...prev, [pubkey]: false }));
    }
  }, [fetchErrors, componentId]);
  
  /**
   * Fetch multiple profiles at once
   */
  const fetchProfiles = React.useCallback(async (pubkeys: string[], options: { force?: boolean } = {}) => {
    if (!pubkeys.length) return {};
    
    // Deduplicate pubkeys
    const uniquePubkeys = [...new Set(pubkeys)];
    console.log(`[useUnifiedProfileFetcher] Batch fetching ${uniquePubkeys.length} profiles`);
    
    // Mark all as loading
    const loadingUpdates: Record<string, boolean> = {};
    uniquePubkeys.forEach(pubkey => {
      loadingUpdates[pubkey] = true;
    });
    setLoading(prev => ({ ...prev, ...loadingUpdates }));
    
    // Set up subscriptions for all pubkeys
    uniquePubkeys.forEach(pubkey => {
      if (!activeSubscriptions.current[pubkey]) {
        activeSubscriptions.current[pubkey] = unifiedProfileService.subscribeToUpdates(pubkey, (profile) => {
          if (profile) {
            console.log(`[useUnifiedProfileFetcher] Received profile update for ${pubkey.substring(0, 8)}`, 
              profile.name || profile.display_name);
            setProfiles(prev => ({ ...prev, [pubkey]: profile }));
          }
        });
        
        // Register with the tracker
        const tracker = SubscriptionTracker.getInstance();
        tracker.register(`profile_sub_${pubkey}`, activeSubscriptions.current[pubkey], componentId);
      }
    });
    
    try {
      // Use the unified service to fetch profiles
      const results = await unifiedProfileService.getProfiles(uniquePubkeys);
      
      // Update state with results
      setProfiles(prev => ({ ...prev, ...results }));
      
      // Clear errors for any successfully fetched profiles
      const errorUpdates: Record<string, string> = { ...fetchErrors };
      Object.keys(results).forEach(pubkey => {
        if (errorUpdates[pubkey]) {
          delete errorUpdates[pubkey];
        }
      });
      setFetchErrors(errorUpdates);
      
      // Track which pubkeys didn't return profiles
      const missingPubkeys = uniquePubkeys.filter(pubkey => !results[pubkey]);
      if (missingPubkeys.length > 0) {
        console.warn(`[useUnifiedProfileFetcher] Missing profiles after batch fetch: ${missingPubkeys.length}`);
        
        // Set errors for missing profiles
        const newErrors: Record<string, string> = {};
        missingPubkeys.forEach(pubkey => {
          newErrors[pubkey] = "Profile not found";
        });
        setFetchErrors(prev => ({ ...prev, ...newErrors }));
      }
      
      return results;
    } catch (error) {
      console.error(`[useUnifiedProfileFetcher] Error in batch fetch:`, error);
      
      // Set errors for all pubkeys
      const errorUpdates: Record<string, string> = {};
      uniquePubkeys.forEach(pubkey => {
        errorUpdates[pubkey] = error instanceof Error ? error.message : "Unknown error";
      });
      setFetchErrors(prev => ({ ...prev, ...errorUpdates }));
      
      return {};
    } finally {
      // Mark all as no longer loading
      const loadingUpdates: Record<string, boolean> = {};
      uniquePubkeys.forEach(pubkey => {
        loadingUpdates[pubkey] = false;
      });
      setLoading(prev => ({ ...prev, ...loadingUpdates }));
    }
  }, [fetchErrors, componentId]);
  
  /**
   * Refresh a profile (force fetch)
   */
  const refreshProfile = React.useCallback((pubkey: string) => {
    return fetchProfile(pubkey, { force: true });
  }, [fetchProfile]);
  
  return {
    profiles,
    fetchProfile,
    fetchProfiles,
    refreshProfile,
    fetchErrors,
    isLoading: (pubkey: string) => loading[pubkey] || false,
    hasError: (pubkey: string) => !!fetchErrors[pubkey]
  };
}
