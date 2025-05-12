
import { useState, useCallback, useEffect } from "react";
import { contentCache, nostrService } from "@/lib/nostr";
import { useProfileCache } from "@/hooks/useProfileCache";
import { toast } from "sonner";

export function useProfileFetcher() {
  const { profiles, fetchProfile, fetchProfiles } = useProfileCache();
  const [fetchingProfiles, setFetchingProfiles] = useState<Record<string, boolean>>({});
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [retryAttempts, setRetryAttempts] = useState<Record<string, number>>({});
  const MAX_RETRIES = 3;
  
  // Enhanced profile fetcher with better error handling, retries and tracking
  // Added options for verbose logging control
  const fetchProfileData = async (pubkey: string, options: { verbose?: boolean } = {}) => {
    if (!pubkey) return;
    
    const verbose = options.verbose ?? false;
    
    try {
      if (verbose) console.log("Fetching profile data for:", pubkey);
      setFetchingProfiles(prev => ({ ...prev, [pubkey]: true }));
      
      // Check if pubkey is in npub format and convert if needed
      const hexPubkey = pubkey.startsWith('npub1') 
        ? nostrService.getHexFromNpub(pubkey) 
        : pubkey;
        
      if (verbose) console.log(`Profile ${pubkey} converted to hex:`, hexPubkey);
      
      // First try to connect to relays to ensure we're ready to receive data
      await nostrService.connectToUserRelays();
      
      // Add more popular relays to increase chances of finding profile data
      await nostrService.addMultipleRelays([
        "wss://relay.damus.io", 
        "wss://nos.lol", 
        "wss://relay.nostr.band",
        "wss://relay.snort.social",
        "wss://nostr.mutinywallet.com"
      ]);
      
      // Mark important profiles (like currently viewed profiles) as important for caching
      const profile = await fetchProfile(hexPubkey, { 
        important: true,
        verbose: verbose
      });
      
      if (profile) {
        if (verbose) console.log("Profile fetched successfully:", profile.name || profile.display_name || hexPubkey);
        
        // Reset retry attempts on success
        setRetryAttempts(prev => {
          const updated = { ...prev };
          delete updated[pubkey];
          return updated;
        });
      } else {
        if (verbose) console.warn("No profile data returned for:", hexPubkey);
        
        // Implement retry logic for failed fetches
        const currentAttempts = retryAttempts[pubkey] || 0;
        if (currentAttempts < MAX_RETRIES) {
          setRetryAttempts(prev => ({ ...prev, [pubkey]: currentAttempts + 1 }));
          
          if (verbose) console.log(`Retry attempt ${currentAttempts + 1}/${MAX_RETRIES} for profile ${pubkey}`);
          
          // Wait a bit before retrying with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, currentAttempts), 8000);
          setTimeout(() => fetchProfileData(pubkey, options), delay);
        }
      }
      
      // Clear any previous errors
      setProfileErrors(prev => {
        const updated = { ...prev };
        delete updated[pubkey];
        return updated;
      });
      
      return profile;
    } catch (error) {
      console.error(`Error fetching profile for ${pubkey}:`, error);
      setProfileErrors(prev => ({ 
        ...prev, 
        [pubkey]: error instanceof Error ? error.message : "Failed to fetch profile"
      }));
      
      const currentAttempts = retryAttempts[pubkey] || 0;
      if (currentAttempts < MAX_RETRIES) {
        toast.error(`Retrying profile data load (${currentAttempts + 1}/${MAX_RETRIES})`);
        
        // Wait before retrying with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, currentAttempts), 8000);
        setTimeout(() => fetchProfileData(pubkey, options), delay);
      } else {
        toast.error(`Couldn't load profile data after ${MAX_RETRIES} attempts`);
      }
      
      return null;
    } finally {
      setFetchingProfiles(prev => ({ ...prev, [pubkey]: false }));
    }
  };
  
  // Enhanced method to fetch multiple profiles at once with parallel processing
  // Added options for verbose logging control
  const fetchMultipleProfiles = async (pubkeys: string[], options: { verbose?: boolean } = {}) => {
    if (!pubkeys.length) return {};
    
    const verbose = options.verbose ?? false;
    
    if (verbose) console.log(`Fetching ${pubkeys.length} profiles in batch`);
    
    try {
      // Ensure we're connected to relays before batch fetching
      await nostrService.connectToUserRelays();
      
      // Add more popular relays to increase chances of finding profiles
      await nostrService.addMultipleRelays([
        "wss://relay.damus.io", 
        "wss://nos.lol", 
        "wss://relay.nostr.band",
        "wss://relay.snort.social"
      ]);
      
      const uniquePubkeys = [...new Set(pubkeys)];
      const results = await fetchProfiles(uniquePubkeys);
      
      // Log success rate only in verbose mode
      if (verbose) {
        const successCount = Object.keys(results).length;
        console.log(`Batch profile fetch: ${successCount}/${uniquePubkeys.length} profiles loaded`);
        
        if (successCount < uniquePubkeys.length * 0.5) {
          console.warn("Less than 50% of profiles loaded, may indicate relay connection issues");
        }
      }
      
      return results;
    } catch (error) {
      console.error("Error in batch profile fetching:", error);
      toast.error("Failed to load some profiles");
      return {};
    }
  };
  
  return {
    profiles,
    fetchProfileData,
    fetchMultipleProfiles,
    fetchingProfiles,
    profileErrors
  };
}
