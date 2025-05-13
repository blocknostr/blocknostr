
import { useState, useCallback, useEffect } from "react";
import { contentCache, nostrService } from "@/lib/nostr";
import { useProfileCache } from "@/hooks/useProfileCache";
import { toast } from "sonner";
import { createMinimalProfile } from "@/hooks/profile/useProfileFetchRetry";

export function useProfileFetcher() {
  const { profiles, fetchProfile, fetchProfiles } = useProfileCache();
  const [fetchingProfiles, setFetchingProfiles] = useState<Record<string, boolean>>({});
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [retryAttempts, setRetryAttempts] = useState<Record<string, number>>({});
  const MAX_RETRIES = 3;
  
  // Enhanced profile fetcher with better error handling, retries and tracking
  const fetchProfileData = async (pubkey: string) => {
    if (!pubkey) return createMinimalProfile("");
    
    try {
      console.log("Fetching profile data for:", pubkey);
      setFetchingProfiles(prev => ({ ...prev, [pubkey]: true }));
      
      // Check if pubkey is in npub format and convert if needed
      const hexPubkey = pubkey.startsWith('npub1') 
        ? nostrService.getHexFromNpub(pubkey) 
        : pubkey;
        
      console.log(`Profile ${pubkey} converted to hex:`, hexPubkey);
      
      // First try to connect to relays to ensure we're ready to receive data
      await nostrService.connectToUserRelays().catch(err => {
        console.warn("Error connecting to user relays:", err);
      });
      
      // Add more popular relays to increase chances of finding profile data
      await nostrService.addMultipleRelays([
        "wss://relay.damus.io", 
        "wss://nos.lol", 
        "wss://relay.nostr.band",
        "wss://relay.snort.social",
        "wss://nostr.mutinywallet.com"
      ]).catch(err => {
        console.warn("Error adding additional relays:", err);
      });
      
      // Mark important profiles (like currently viewed profiles) as important for caching
      const profile = await fetchProfile(hexPubkey, { important: true });
      
      // Always ensure we have a valid profile, even if minimal
      const finalProfile = profile || createMinimalProfile(hexPubkey);
      
      if (profile) {
        console.log("Profile fetched successfully:", 
          finalProfile.name || finalProfile.display_name || hexPubkey);
        
        // Reset retry attempts on success
        setRetryAttempts(prev => {
          const updated = { ...prev };
          delete updated[pubkey];
          return updated;
        });
      } else {
        console.warn("No profile data returned for:", hexPubkey);
        
        // Implement retry logic for failed fetches
        const currentAttempts = retryAttempts[pubkey] || 0;
        if (currentAttempts < MAX_RETRIES) {
          setRetryAttempts(prev => ({ ...prev, [pubkey]: currentAttempts + 1 }));
          
          console.log(`Retry attempt ${currentAttempts + 1}/${MAX_RETRIES} for profile ${pubkey}`);
          
          // Wait a bit before retrying with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, currentAttempts), 8000);
          setTimeout(() => fetchProfileData(pubkey), delay);
        }
      }
      
      // Clear any previous errors
      setProfileErrors(prev => {
        const updated = { ...prev };
        delete updated[pubkey];
        return updated;
      });
      
      return finalProfile;
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
        setTimeout(() => fetchProfileData(pubkey), delay);
      } else {
        toast.error(`Couldn't load profile data after ${MAX_RETRIES} attempts`);
      }
      
      return createMinimalProfile(pubkey);
    } finally {
      setFetchingProfiles(prev => ({ ...prev, [pubkey]: false }));
    }
  };
  
  // Enhanced method to fetch multiple profiles at once with parallel processing
  const fetchMultipleProfiles = async (pubkeys: string[]) => {
    if (!pubkeys.length) return {};
    
    console.log(`Fetching ${pubkeys.length} profiles in batch`);
    
    try {
      // Ensure we're connected to relays before batch fetching
      await nostrService.connectToUserRelays().catch(err => {
        console.warn("Error connecting to user relays:", err);
      });
      
      // Add more popular relays to increase chances of finding profiles
      await nostrService.addMultipleRelays([
        "wss://relay.damus.io", 
        "wss://nos.lol", 
        "wss://relay.nostr.band",
        "wss://relay.snort.social"
      ]).catch(err => {
        console.warn("Error adding additional relays:", err);
      });
      
      const uniquePubkeys = [...new Set(pubkeys)];
      const results = await fetchProfiles(uniquePubkeys);
      
      // Create minimal profiles for any that weren't found
      const completeResults = { ...results };
      for (const pubkey of uniquePubkeys) {
        if (!completeResults[pubkey]) {
          completeResults[pubkey] = createMinimalProfile(pubkey);
        }
      }
      
      // Log success rate
      const successCount = Object.keys(results).length;
      console.log(`Batch profile fetch: ${successCount}/${uniquePubkeys.length} profiles loaded`);
      
      if (successCount < uniquePubkeys.length * 0.5) {
        console.warn("Less than 50% of profiles loaded, may indicate relay connection issues");
      }
      
      return completeResults;
    } catch (error) {
      console.error("Error in batch profile fetching:", error);
      toast.error("Failed to load some profiles");
      
      // Return minimal profiles for all requested pubkeys
      const fallbackProfiles = pubkeys.reduce((acc, pubkey) => {
        acc[pubkey] = createMinimalProfile(pubkey);
        return acc;
      }, {} as Record<string, any>);
      
      return fallbackProfiles;
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
