
import * as React from "react";
import { nostrService } from "@/lib/nostr";

export function useSidebarProfile() {
  const isLoggedIn = !!nostrService.publicKey;
  const [userProfile, setUserProfile] = React.useState<{
    name?: string;
    display_name?: string;
    picture?: string;
    nip05?: string;
    about?: string;
    created_at?: number;
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
            // Get account creation date if not already in profile
            let creationDate = profile._event?.created_at || profile.created_at;
            if (!creationDate) {
              try {
                // Direct call to the getAccountCreationDate method instead of using getProfileService()
                const date = await nostrService.getAccountCreationDate(nostrService.publicKey);
                if (date) {
                  creationDate = date;
                }
              } catch (e) {
                console.warn("Could not fetch account creation date:", e);
              }
            }
            
            setUserProfile({
              name: profile.name,
              display_name: profile.display_name,
              picture: profile.picture,
              nip05: profile.nip05,
              about: profile.about,
              created_at: creationDate
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
