
import { useEffect } from 'react';
import { nostrService } from '@/lib/nostr';

interface UseProfileDebugInfoProps {
  npub: string | undefined;
  hexNpub: string | null;
  loading: boolean;
  profileData: any | null;
}

export function useProfileDebugInfo({ npub, hexNpub, loading, profileData }: UseProfileDebugInfoProps) {
  // Log important information for debugging
  useEffect(() => {
    if (npub) {
      console.log("Profile page for npub:", npub);
      
      try {
        const hex = nostrService.getHexFromNpub(npub);
        console.log("Converted to hex pubkey:", hex);
      } catch (error) {
        console.error("Error converting npub to hex:", error);
      }
    }
    
    if (hexNpub) {
      console.log("Using hex pubkey for profile:", hexNpub);
    }
    
    if (loading) {
      console.log("Profile data loading...");
    } else {
      console.log("Profile data loaded:", profileData ? "success" : "not found");
    }
  }, [npub, hexNpub, loading, profileData]);
}
