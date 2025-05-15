
import { useState, useCallback } from "react";
import { chatNostrService } from "@/lib/nostr/chat-service";

/**
 * Hook to manage profile fetching for the chat
 */
export const useProfileFetcher = () => {
  const [profiles, setProfiles] = useState<Record<string, any>>({});

  // Fetch a profile by pubkey
  const fetchProfile = useCallback(async (pubkey: string) => {
    if (!pubkey || profiles[pubkey]) return;

    try {
      // Use the adapter method if available, otherwise use a direct method
      const metadata = await chatNostrService.data.getUserProfile?.(pubkey) ||
                      await chatNostrService.fetchProfileData?.(pubkey);
                      
      if (metadata) {
        setProfiles(prev => ({
          ...prev,
          [pubkey]: metadata
        }));
      }
    } catch (error) {
      console.error(`Error fetching profile for ${pubkey}:`, error);
    }
  }, [profiles]);

  return { 
    profiles, 
    fetchProfile 
  };
};
