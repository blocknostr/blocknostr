
import { useState, useCallback } from 'react';
import { nostrService } from '@/lib/nostr';
import { contentCache } from '@/lib/nostr/cache/content-cache';

/**
 * Enhanced hook for smarter profile data caching
 */
export function useProfileCache() {
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  
  // Track which pubkeys have been requested
  const [requestedPubkeys, setRequestedPubkeys] = useState<Set<string>>(new Set());
  
  // Fetch profile with smart caching
  const fetchProfile = useCallback(async (pubkey: string, options?: { 
    force?: boolean,
    important?: boolean,
    verbose?: boolean
  }) => {
    if (!pubkey) return null;
    
    const opts = {
      force: false,
      important: false,
      verbose: false,
      ...options
    };
    
    // Skip if already loaded or loading (unless forcing refresh)
    if (!opts.force && (profiles[pubkey] || loading[pubkey])) {
      return profiles[pubkey] || null;
    }
    
    // Mark as loading
    setLoading(prev => ({ ...prev, [pubkey]: true }));
    
    try {
      // Check cache first
      const cachedProfile = contentCache.getProfile(pubkey);
      
      if (cachedProfile && !opts.force) {
        setProfiles(prev => ({
          ...prev,
          [pubkey]: cachedProfile
        }));
        
        // Update requested pubkeys tracking
        setRequestedPubkeys(prev => {
          const updated = new Set(prev);
          updated.add(pubkey);
          return updated;
        });
        
        setLoading(prev => ({ ...prev, [pubkey]: false }));
        return cachedProfile;
      }
      
      // Fetch from network
      const profile = await nostrService.getUserProfile(pubkey);
      
      if (profile) {
        // Update state
        setProfiles(prev => ({
          ...prev,
          [pubkey]: profile
        }));
        
        // Cache the profile with importance flag
        contentCache.cacheProfile(pubkey, profile, opts.important);
        
        // Update requested pubkeys tracking
        setRequestedPubkeys(prev => {
          const updated = new Set(prev);
          updated.add(pubkey);
          return updated;
        });
        
        setLoading(prev => ({ ...prev, [pubkey]: false }));
        return profile;
      }
      
      setLoading(prev => ({ ...prev, [pubkey]: false }));
      return null;
    } catch (error) {
      console.error(`Error fetching profile for ${pubkey}:`, error);
      setLoading(prev => ({ ...prev, [pubkey]: false }));
      return null;
    }
  }, [profiles, loading]);
  
  // Batch fetch multiple profiles at once
  const fetchProfiles = useCallback(async (pubkeys: string[]) => {
    if (!pubkeys.length) return {};
    
    // Deduplicate pubkeys
    const uniquePubkeys = [...new Set(pubkeys)];
    
    // Filter out already cached profiles
    const uncachedPubkeys = uniquePubkeys.filter(pubkey => 
      !profiles[pubkey] && !loading[pubkey]
    );
    
    if (uncachedPubkeys.length === 0) {
      // Return already cached profiles
      return uniquePubkeys.reduce((acc, pubkey) => {
        if (profiles[pubkey]) {
          acc[pubkey] = profiles[pubkey];
        }
        return acc;
      }, {} as Record<string, any>);
    }
    
    // Mark all as loading
    setLoading(prev => {
      const updated = { ...prev };
      uncachedPubkeys.forEach(pubkey => {
        updated[pubkey] = true;
      });
      return updated;
    });
    
    try {
      // Check cache first
      const cachedProfiles: Record<string, any> = {};
      const remainingPubkeys: string[] = [];
      
      uncachedPubkeys.forEach(pubkey => {
        const cached = contentCache.getProfile(pubkey);
        if (cached) {
          cachedProfiles[pubkey] = cached;
        } else {
          remainingPubkeys.push(pubkey);
        }
      });
      
      // Update state with cached profiles
      if (Object.keys(cachedProfiles).length > 0) {
        setProfiles(prev => ({
          ...prev,
          ...cachedProfiles
        }));
      }
      
      // Return if all profiles were cached
      if (remainingPubkeys.length === 0) {
        // Mark all as no longer loading
        setLoading(prev => {
          const updated = { ...prev };
          uncachedPubkeys.forEach(pubkey => {
            updated[pubkey] = false;
          });
          return updated;
        });
        
        return {
          ...cachedProfiles,
          ...uniquePubkeys
            .filter(pubkey => profiles[pubkey])
            .reduce((acc, pubkey) => {
              acc[pubkey] = profiles[pubkey];
              return acc;
            }, {} as Record<string, any>)
        };
      }
      
      // Fetch remaining profiles
      const fetchedProfiles = await nostrService.getProfilesByPubkeys(remainingPubkeys);
      
      // Update state
      if (Object.keys(fetchedProfiles).length > 0) {
        setProfiles(prev => ({
          ...prev,
          ...fetchedProfiles
        }));
        
        // Cache fetched profiles
        Object.entries(fetchedProfiles).forEach(([pubkey, profile]) => {
          contentCache.cacheProfile(pubkey, profile);
        });
      }
      
      // Update requested pubkeys tracking
      setRequestedPubkeys(prev => {
        const updated = new Set(prev);
        uncachedPubkeys.forEach(pubkey => updated.add(pubkey));
        return updated;
      });
      
      // Mark all as no longer loading
      setLoading(prev => {
        const updated = { ...prev };
        uncachedPubkeys.forEach(pubkey => {
          updated[pubkey] = false;
        });
        return updated;
      });
      
      return {
        ...fetchedProfiles,
        ...cachedProfiles,
        ...uniquePubkeys
          .filter(pubkey => profiles[pubkey])
          .reduce((acc, pubkey) => {
            acc[pubkey] = profiles[pubkey];
            return acc;
          }, {} as Record<string, any>)
      };
    } catch (error) {
      console.error(`Error fetching profiles:`, error);
      
      // Mark all as no longer loading
      setLoading(prev => {
        const updated = { ...prev };
        uncachedPubkeys.forEach(pubkey => {
          updated[pubkey] = false;
        });
        return updated;
      });
      
      return uniquePubkeys
        .filter(pubkey => profiles[pubkey])
        .reduce((acc, pubkey) => {
          acc[pubkey] = profiles[pubkey];
          return acc;
        }, {} as Record<string, any>);
    }
  }, [profiles, loading]);
  
  // Get a profile from cache or state
  const getProfile = useCallback((pubkey: string) => {
    return profiles[pubkey] || null;
  }, [profiles]);
  
  // Check if a profile is loaded
  const isProfileLoaded = useCallback((pubkey: string) => {
    return !!profiles[pubkey];
  }, [profiles]);
  
  // Check if a profile is loading
  const isProfileLoading = useCallback((pubkey: string) => {
    return !!loading[pubkey];
  }, [loading]);
  
  return {
    profiles,
    loading,
    fetchProfile,
    fetchProfiles,
    getProfile,
    isProfileLoaded,
    isProfileLoading
  };
}
