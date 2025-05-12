
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { nostrService } from '@/lib/nostr';
import { contentCache } from '@/lib/nostr';
import { connectToProfileRelays } from './utils/relayConnection';
import { getHexPubkey } from './utils/pubkeyUtils';

/**
 * Hook encapsulating the profile fetching logic
 */
export function useProfileFetch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Fetch a profile by pubkey with caching
   */
  const fetchProfile = useCallback(async (
    pubkeyInput: string | undefined, 
    options: { forceRefresh?: boolean } = {}
  ) => {
    if (!pubkeyInput) {
      setError("No profile identifier provided");
      return null;
    }
    
    const hexPubkey = getHexPubkey(pubkeyInput);
    
    if (!hexPubkey) {
      setError("Invalid profile identifier");
      toast.error("Invalid profile identifier");
      return null;
    }
    
    console.log("Fetching profile for hex pubkey:", hexPubkey);
    setLoading(true);
    setError(null);
    
    try {
      // Check cache first if not forcing refresh
      const cachedProfile = !options.forceRefresh ? contentCache.getProfile(hexPubkey) : null;
      
      if (cachedProfile) {
        console.log("Found cached profile:", cachedProfile.name || cachedProfile.display_name || hexPubkey);
        setLoading(false);
        return cachedProfile;
      }
      
      // Connect to relays
      await connectToProfileRelays();
      
      console.log("Connected to relays, fetching profile...");
      
      // Fetch profile metadata directly
      const profileMetadata = await nostrService.getUserProfile(hexPubkey);
      
      if (profileMetadata) {
        console.log("Profile found:", profileMetadata.name || profileMetadata.display_name || hexPubkey);
        
        // Cache the profile
        try {
          contentCache.cacheProfile(hexPubkey, profileMetadata, true);
        } catch (cacheError) {
          console.warn("Failed to cache profile:", cacheError);
        }
        
        setLoading(false);
        return profileMetadata;
      } else {
        console.warn("No profile data returned for pubkey:", hexPubkey);
        
        // If no profile found, create minimal data
        const minimalData = {
          pubkey: hexPubkey,
          created_at: Math.floor(Date.now() / 1000)
        };
        
        setLoading(false);
        return minimalData;
      }
    } catch (connectionError) {
      console.error("Error fetching profile:", connectionError);
      
      // If we have cached data despite the error, we can still show it
      const cachedProfile = contentCache.getProfile(hexPubkey);
      
      if (cachedProfile) {
        console.log("Using cached profile data due to connection error");
        setLoading(false);
        return cachedProfile;
      }
      
      // Create minimal profile data
      const minimalData = {
        pubkey: hexPubkey,
        created_at: Math.floor(Date.now() / 1000)
      };
      
      setError("Could not connect to relays");
      toast.error("Could not connect to relays");
      
      setLoading(false);
      return minimalData;
    }
  }, []);
  
  return {
    fetchProfile,
    loading,
    error
  };
}
