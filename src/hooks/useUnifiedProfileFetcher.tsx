
import { useState, useEffect, useCallback } from 'react';
import { unifiedProfileService } from '@/lib/services/UnifiedProfileService';
import { eventBus, EVENTS } from '@/lib/services/EventBus';

/**
 * Enhanced hook for profile data fetching that uses the unified profile service
 * and supports real-time updates via the event bus
 */
export function useUnifiedProfileFetcher() {
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loadingProfiles, setLoadingProfiles] = useState<Record<string, boolean>>({});
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  
  // Track which pubkeys we're actively tracking
  const [trackedPubkeys, setTrackedPubkeys] = useState<Set<string>>(new Set());
  
  // Setup event listener for profile updates
  useEffect(() => {
    const handleProfileUpdate = (pubkey: string, profile: any) => {
      console.log(`[useUnifiedProfileFetcher] Received profile update for ${pubkey.substring(0, 8)}`, 
        profile?.name || profile?.display_name);
        
      // Only update if we're tracking this pubkey
      if (trackedPubkeys.has(pubkey)) {
        setProfiles(prev => ({
          ...prev,
          [pubkey]: profile
        }));
        
        // Clear loading state and errors
        setLoadingProfiles(prev => {
          const newState = { ...prev };
          delete newState[pubkey];
          return newState;
        });
        
        setProfileErrors(prev => {
          const newState = { ...prev };
          delete newState[pubkey];
          return newState;
        });
      }
    };
    
    eventBus.on(EVENTS.PROFILE_UPDATED, handleProfileUpdate);
    
    return () => {
      eventBus.off(EVENTS.PROFILE_UPDATED, handleProfileUpdate);
    };
  }, [trackedPubkeys]);
  
  /**
   * Fetch a single profile
   */
  const fetchProfile = useCallback(async (pubkey: string, options?: { force?: boolean }) => {
    if (!pubkey) return;
    
    // Start tracking this pubkey
    setTrackedPubkeys(prev => {
      const newSet = new Set(prev);
      newSet.add(pubkey);
      return newSet;
    });
    
    // Set loading state
    setLoadingProfiles(prev => ({
      ...prev,
      [pubkey]: true
    }));
    
    try {
      console.log(`[useUnifiedProfileFetcher] Fetching profile for ${pubkey.substring(0, 8)}...`);
      const profile = await unifiedProfileService.getProfile(pubkey, options);
      
      if (profile) {
        console.log(`[useUnifiedProfileFetcher] Profile fetched for ${pubkey.substring(0, 8)}:`, 
          profile.name || profile.display_name);
          
        setProfiles(prev => ({
          ...prev,
          [pubkey]: profile
        }));
      } else {
        console.log(`[useUnifiedProfileFetcher] No profile found for ${pubkey.substring(0, 8)}`);
      }
    } catch (error) {
      console.error(`[useUnifiedProfileFetcher] Error fetching profile for ${pubkey}:`, error);
      setProfileErrors(prev => ({
        ...prev,
        [pubkey]: error instanceof Error ? error.message : 'Unknown error'
      }));
    } finally {
      setLoadingProfiles(prev => {
        const newState = { ...prev };
        delete newState[pubkey];
        return newState;
      });
    }
  }, []);
  
  /**
   * Fetch multiple profiles at once
   */
  const fetchProfiles = useCallback(async (pubkeys: string[]) => {
    if (!pubkeys.length) return;
    
    // Filter out already loaded profiles
    const pubkeysToFetch = pubkeys.filter(pubkey => !profiles[pubkey]);
    
    if (pubkeysToFetch.length === 0) return;
    
    console.log(`[useUnifiedProfileFetcher] Fetching ${pubkeysToFetch.length} profiles...`);
    
    // Track all pubkeys
    setTrackedPubkeys(prev => {
      const newSet = new Set(prev);
      pubkeysToFetch.forEach(pubkey => newSet.add(pubkey));
      return newSet;
    });
    
    // Set loading states
    setLoadingProfiles(prev => {
      const newState = { ...prev };
      pubkeysToFetch.forEach(pubkey => {
        newState[pubkey] = true;
      });
      return newState;
    });
    
    try {
      const fetchedProfiles = await unifiedProfileService.getProfiles(pubkeysToFetch);
      
      console.log(`[useUnifiedProfileFetcher] Fetched ${Object.keys(fetchedProfiles).length} profiles`);
      
      if (Object.keys(fetchedProfiles).length > 0) {
        setProfiles(prev => ({
          ...prev,
          ...fetchedProfiles
        }));
      }
    } catch (error) {
      console.error('[useUnifiedProfileFetcher] Error batch fetching profiles:', error);
    } finally {
      // Clear loading states
      setLoadingProfiles(prev => {
        const newState = { ...prev };
        pubkeysToFetch.forEach(pubkey => {
          delete newState[pubkey];
        });
        return newState;
      });
    }
  }, [profiles]);
  
  return {
    profiles,
    loadingProfiles,
    profileErrors,
    fetchProfile,
    fetchProfiles,
    hasProfile: useCallback((pubkey: string) => !!profiles[pubkey], [profiles]),
    isProfileLoading: useCallback((pubkey: string) => !!loadingProfiles[pubkey], [loadingProfiles])
  };
}
