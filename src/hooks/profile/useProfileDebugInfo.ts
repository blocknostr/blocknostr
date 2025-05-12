
import { useEffect } from 'react';
import { nostrService } from '@/lib/nostr';

interface UseProfileDebugInfoProps {
  npub: string | undefined;
  hexNpub: string | null;
  loading: boolean;
  profileData: any | null;
  debugMode?: boolean; // Add debug mode flag to control logging
}

export function useProfileDebugInfo({ 
  npub, 
  hexNpub, 
  loading, 
  profileData,
  debugMode = false // Default to no debug logging
}: UseProfileDebugInfoProps) {
  // Only log when in debug mode
  useEffect(() => {
    // Skip logging unless explicitly in debug mode
    if (!debugMode) return;
    
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
  }, [npub, hexNpub, loading, profileData, debugMode]);
}
