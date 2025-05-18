
import * as React from "react";
import { nostrService } from "@/lib/nostr";
import { toast } from "sonner";

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
  const [error, setError] = React.useState<Error | null>(null);
  const isMounted = React.useRef(true);
  const fetchAttempts = React.useRef(0);
  const maxFetchAttempts = 3;
  
  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Force profile refresh when route changes, user logs in, or after 30 seconds
  React.useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isLoggedIn || !nostrService.publicKey) {
        setUserProfile({});
        return;
      }
      
      if (fetchAttempts.current >= maxFetchAttempts) {
        console.warn("Max fetch attempts reached for profile");
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Make sure we're connected to relays
        await nostrService.connectToUserRelays().catch(e => {
          console.warn("Could not connect to relays:", e);
          // Continue anyway, might still work with existing connections
        });
        
        const profile = await nostrService.getUserProfile(nostrService.publicKey);
        
        // Safety check to prevent state updates after unmount
        if (!isMounted.current) return;
        
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
          
          // Reset fetch attempts on success
          fetchAttempts.current = 0;
        } else {
          // No profile found but not an error
          console.log("No profile found for current user");
          fetchAttempts.current += 1;
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        
        if (isMounted.current) {
          setError(error instanceof Error ? error : new Error('Unknown error'));
          fetchAttempts.current += 1;
          
          if (fetchAttempts.current === maxFetchAttempts) {
            toast.error("Could not load your profile. Please try again later.");
          }
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };
    
    fetchUserProfile();
    
    // Set up an interval to periodically refresh the profile
    const intervalId = setInterval(fetchUserProfile, 30000);
    
    return () => clearInterval(intervalId);
  }, [isLoggedIn]);
  
  return { 
    isLoggedIn, 
    userProfile, 
    isLoading, 
    error,
    // Add refresh method for manual refresh
    refreshProfile: async () => {
      fetchAttempts.current = 0; // Reset attempts counter for manual refresh
      setUserProfile({}); // Clear current data
      setIsLoading(true);
      
      try {
        // Connect to relays
        await nostrService.connectToUserRelays();
        
        // Clear cache
        if (nostrService.publicKey) {
          const profile = await nostrService.getUserProfile(nostrService.publicKey, true); // Force refresh
          
          if (isMounted.current && profile) {
            setUserProfile({
              name: profile.name,
              display_name: profile.display_name,
              picture: profile.picture,
              nip05: profile.nip05,
              about: profile.about,
              created_at: profile._event?.created_at || profile.created_at
            });
            setError(null);
          }
        }
      } catch (error) {
        console.error("Failed to refresh profile:", error);
        if (isMounted.current) {
          setError(error instanceof Error ? error : new Error('Unknown error'));
          toast.error("Failed to refresh your profile");
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    }
  };
}
