
import { useState, useCallback } from 'react';
import { nostrService } from '@/lib/nostr';
import { toast } from 'sonner';
import { contentCache } from '@/lib/nostr';
import { getHexPubkey } from '@/lib/utils/profileUtils';

interface UseProfileFetchOptions {
  onSuccess?: (profileData: any) => void;
}

export function useProfileFetch(options: UseProfileFetchOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { onSuccess } = options;
  
  const fetchProfile = useCallback(async (hexPubkey: string) => {
    if (!hexPubkey) {
      setError("Invalid profile identifier");
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching profile for hex pubkey:", hexPubkey);
      
      // Check cache first
      const cachedProfile = contentCache.getProfile(hexPubkey);
      if (cachedProfile) {
        console.log("Found cached profile:", cachedProfile.name || cachedProfile.display_name || hexPubkey);
        
        if (onSuccess) {
          onSuccess(cachedProfile);
        }
        
        setLoading(false);
        return cachedProfile;
      }
      
      // Connect to relays if not already connected
      try {
        await nostrService.connectToUserRelays();
        
        // Add some popular relays to increase chances of finding the profile
        const additionalRelays = [
          "wss://relay.damus.io", 
          "wss://relay.nostr.band", 
          "wss://nos.lol",
          "wss://nostr-pub.wellorder.net",
          "wss://relay.nostr.info"
        ];
        await nostrService.addMultipleRelays(additionalRelays);
        
        console.log("Connected to relays, fetching profile...");
        
        const profileMetadata = await nostrService.getUserProfile(hexPubkey);
        
        if (profileMetadata) {
          console.log("Profile found:", profileMetadata.name || profileMetadata.display_name || hexPubkey);
          
          // Cache the profile
          try {
            contentCache.cacheProfile(hexPubkey, profileMetadata, true);
          } catch (cacheError) {
            console.warn("Failed to cache profile:", cacheError);
          }
          
          if (onSuccess) {
            onSuccess(profileMetadata);
          }
          
          setLoading(false);
          return profileMetadata;
        } else {
          console.warn("No profile data returned for pubkey:", hexPubkey);
          setLoading(false);
          return null;
        }
      } catch (connectionError) {
        console.error("Error connecting to relays:", connectionError);
        
        // If we have cached data, we can still show it
        if (cachedProfile) {
          console.log("Using cached profile data due to connection error");
          
          if (onSuccess) {
            onSuccess(cachedProfile);
          }
          
          setLoading(false);
          return cachedProfile;
        } else {
          // Create minimal profile data
          const minimalData = {
            pubkey: hexPubkey,
            created_at: Math.floor(Date.now() / 1000)
          };
          
          if (onSuccess) {
            onSuccess(minimalData);
          }
          
          toast.error("Could not connect to relays");
          setLoading(false);
          return minimalData;
        }
      }
    } catch (error) {
      console.error("Error fetching profile metadata:", error);
      setError("Failed to load profile");
      toast.error("Could not load profile data. Please try again.");
      setLoading(false);
      return null;
    }
  }, [onSuccess]);
  
  const fetchProfileFromIdentifier = useCallback(async (identifier: string | undefined) => {
    if (!identifier) return null;
    
    const hexPubkey = getHexPubkey(identifier);
    if (!hexPubkey) {
      toast.error("Invalid profile identifier");
      setError("Invalid profile identifier");
      return null;
    }
    
    return fetchProfile(hexPubkey);
  }, [fetchProfile]);
  
  return {
    fetchProfile,
    fetchProfileFromIdentifier,
    loading,
    error,
    setError
  };
}
