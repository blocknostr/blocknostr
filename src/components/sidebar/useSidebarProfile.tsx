
import { useState, useEffect } from "react";
import { nostrService } from "@/lib/nostr";
import { NostrProfileMetadata } from "@/lib/nostr/types";

export function useSidebarProfile() {
  const isLoggedIn = !!nostrService.publicKey;
  const [userProfile, setUserProfile] = useState<{
    name?: string;
    display_name?: string;
    picture?: string;
    nip05?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Force profile refresh when route changes, user logs in, or after 30 seconds
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isLoggedIn && nostrService.publicKey) {
        try {
          setIsLoading(true);
          // Make sure we're connected to relays
          await nostrService.connectToUserRelays();
          
          const profile = await nostrService.getUserProfile(nostrService.publicKey);
          if (profile) {
            setUserProfile({
              name: typeof profile.name === 'string' ? profile.name : undefined,
              display_name: typeof profile.display_name === 'string' ? profile.display_name : undefined,
              picture: typeof profile.picture === 'string' ? profile.picture : undefined,
              nip05: typeof profile.nip05 === 'string' ? profile.nip05 : undefined
            });
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchUserProfile();
    
    // Set up an interval to periodically refresh the profile
    const intervalId = setInterval(fetchUserProfile, 30000);
    
    return () => clearInterval(intervalId);
  }, [isLoggedIn]);
  
  return { isLoggedIn, userProfile, isLoading };
}
