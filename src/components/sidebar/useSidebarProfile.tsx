
import { useState, useEffect } from "react";
import { nostrService } from "@/lib/nostr";

export function useSidebarProfile() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<any>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pubkey, setPubkey] = useState<string | null>(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      setIsLoading(true);
      try {
        const loggedIn = await nostrService.isLoggedIn();
        setIsLoggedIn(loggedIn);
        
        if (loggedIn) {
          const pk = await nostrService.getPublicKey();
          setPubkey(pk);
          
          // Get profile data
          const profileData = await nostrService.getProfileData(pk);
          setUserProfile(profileData || {});
          
          // Store pubkey in localStorage for use in other components
          localStorage.setItem('nostr:pubkey', pk);
        } else {
          setPubkey(null);
          setUserProfile({});
          localStorage.removeItem('nostr:pubkey');
        }
      } catch (error) {
        console.error("Error checking login status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  return { isLoggedIn, userProfile, isLoading, pubkey };
}
