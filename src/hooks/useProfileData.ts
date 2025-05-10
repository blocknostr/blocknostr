
import { useCallback } from "react";
import { nostrService } from "@/lib/nostr";

export const useProfileData = () => {
  const fetchProfileData = useCallback((pubkey: string, profiles: Record<string, any>, setProfiles: (profiles: Record<string, any>) => void) => {
    const metadataSubId = nostrService.subscribe(
      [
        {
          kinds: [0],
          authors: [pubkey],
          limit: 1
        }
      ],
      (event) => {
        try {
          const metadata = JSON.parse(event.content);
          setProfiles(prev => ({
            ...prev,
            [pubkey]: metadata
          }));
        } catch (e) {
          console.error('Failed to parse profile metadata:', e);
        }
      }
    );
    
    // Cleanup subscription after a short time
    setTimeout(() => {
      nostrService.unsubscribe(metadataSubId);
    }, 5000);
  }, []);

  return { fetchProfileData };
};
