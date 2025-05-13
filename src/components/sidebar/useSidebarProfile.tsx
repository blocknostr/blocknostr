
import * as React from "react";
import { nostrService } from "@/lib/nostr";

export function useSidebarProfile() {
  const isLoggedIn = !!nostrService.publicKey;
  const [userProfile, setUserProfile] = React.useState<{
    name?: string;
    display_name?: string;
    picture?: string;
    nip05?: string;
  }>({});
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Force profile refresh when route changes, user logs in, or after 30 seconds
  React.useEffect(() => {
    const fetchUserProfile = async () => {
      if (isLoggedIn && nostrService.publicKey) {
        try {
          setIsLoading(true);
          
          // Make sure we're connected to relays
          await nostrService.connectToUserRelays();
          
          const profile = await nostrService.getUserProfile(nostrService.publicKey);
          if (profile) {
            setUserProfile({
              name: profile.name,
              display_name: profile.display_name,
              picture: profile.picture,
              nip05: profile.nip05
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
