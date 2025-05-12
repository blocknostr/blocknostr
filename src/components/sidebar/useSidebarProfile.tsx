
import { useState, useEffect } from "react";
import { nostrService } from "@/lib/nostr";

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
          
          // Check if we need to connect to relays first
          const relays = nostrService.getRelayStatus();
          const connectedRelays = relays.filter(r => r.status === 'connected').length;
          
          if (connectedRelays === 0) {
            console.log("No relays connected. Attempting to connect before fetching profile...");
            await nostrService.connectToUserRelays();
            
            // Verify connection success
            const updatedRelays = nostrService.getRelayStatus();
            const nowConnected = updatedRelays.filter(r => r.status === 'connected').length;
            
            if (nowConnected === 0) {
              console.log("Still couldn't connect to any relays. Will try to fetch profile anyway...");
            } else {
              console.log(`Connected to ${nowConnected} relays successfully`);
            }
          }
          
          // Now try to get the profile
          const profile = await nostrService.getUserProfile(nostrService.publicKey);
          
          if (profile) {
            console.log("Profile fetched successfully:", profile.name);
            setUserProfile({
              name: profile.name,
              display_name: profile.display_name,
              picture: profile.picture,
              nip05: profile.nip05
            });
          } else {
            console.log("No profile data returned from getUserProfile");
            setUserProfile({});
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    // Don't fetch immediately, give time for connections to establish
    const initialTimer = setTimeout(() => {
      fetchUserProfile();
    }, 1000);
    
    // Set up an interval to periodically refresh the profile
    const intervalId = setInterval(fetchUserProfile, 30000);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalId);
    };
  }, [isLoggedIn]);
  
  return { isLoggedIn, userProfile, isLoading };
}
