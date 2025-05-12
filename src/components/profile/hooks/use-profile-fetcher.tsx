
import { useState, useCallback } from "react";
import { contentCache, nostrService } from "@/lib/nostr";
import { useProfileCache } from "@/hooks/useProfileCache";

export function useProfileFetcher() {
  const { profiles, fetchProfile, fetchProfiles } = useProfileCache();
  
  // This optimized fetcher now leverages our enhanced profile cache
  const fetchProfileData = async (pubkey: string) => {
    if (!pubkey) return;
    
    // Mark important profiles (like currently viewed profiles) as important for caching
    await fetchProfile(pubkey, { important: true });
  };
  
  // New method to fetch multiple profiles at once
  const fetchMultipleProfiles = async (pubkeys: string[]) => {
    return await fetchProfiles(pubkeys);
  };
  
  return {
    profiles,
    fetchProfileData,
    fetchMultipleProfiles
  };
}
