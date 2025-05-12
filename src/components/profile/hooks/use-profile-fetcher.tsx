
import { useState, useCallback, useEffect } from "react";
import { contentCache, nostrService } from "@/lib/nostr";
import { useProfileCache } from "@/hooks/useProfileCache";
import { toast } from "sonner";

export function useProfileFetcher() {
  const { profiles, fetchProfile, fetchProfiles } = useProfileCache();
  const [fetchingProfiles, setFetchingProfiles] = useState<Record<string, boolean>>({});
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  
  // Enhanced profile fetcher with better error handling and tracking
  const fetchProfileData = async (pubkey: string) => {
    if (!pubkey) return;
    
    try {
      console.log("Fetching profile data for:", pubkey);
      setFetchingProfiles(prev => ({ ...prev, [pubkey]: true }));
      
      // Check if pubkey is in npub format and convert if needed
      const hexPubkey = pubkey.startsWith('npub1') 
        ? nostrService.getHexFromNpub(pubkey) 
        : pubkey;
        
      console.log(`Profile ${pubkey} converted to hex:`, hexPubkey);
      
      // Mark important profiles (like currently viewed profiles) as important for caching
      const profile = await fetchProfile(hexPubkey, { important: true });
      
      if (profile) {
        console.log("Profile fetched successfully:", profile.name || profile.display_name || hexPubkey);
      } else {
        console.warn("No profile data returned for:", hexPubkey);
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
      toast.error(`Couldn't load profile data`);
      return null;
    } finally {
      setFetchingProfiles(prev => ({ ...prev, [pubkey]: false }));
    }
  };
  
  // Enhanced method to fetch multiple profiles at once with parallel processing
  const fetchMultipleProfiles = async (pubkeys: string[]) => {
    if (!pubkeys.length) return {};
    
    console.log(`Fetching ${pubkeys.length} profiles in batch`);
    
    try {
      const uniquePubkeys = [...new Set(pubkeys)];
      const results = await fetchProfiles(uniquePubkeys);
      
      // Log success rate
      const successCount = Object.keys(results).length;
      console.log(`Batch profile fetch: ${successCount}/${uniquePubkeys.length} profiles loaded`);
      
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
