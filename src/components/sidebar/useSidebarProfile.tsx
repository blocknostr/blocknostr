
import * as React from "react";
import { nostrService } from "@/lib/nostr";
import { contentCache } from "@/lib/nostr/cache";
import { toast } from "@/hooks/use-toast";

export function useSidebarProfile() {
  const isLoggedIn = !!nostrService.publicKey;
  const [userProfile, setUserProfile] = React.useState<{
    name?: string;
    display_name?: string;
    picture?: string;
    nip05?: string;
    about?: string;
  }>({});
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);
  const [lastRefreshTime, setLastRefreshTime] = React.useState(0);
  
  // Fetch user profile function that can be called on demand
  const fetchUserProfile = React.useCallback(async () => {
    if (!isLoggedIn || !nostrService.publicKey) {
      setUserProfile({});
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // First check if we have a cached profile
      const cachedProfile = contentCache.getProfile(nostrService.publicKey);
      if (cachedProfile && Date.now() - lastRefreshTime < 60000) {
        // Use cached profile if it exists and was refreshed less than a minute ago
        setUserProfile({
          name: cachedProfile.name,
          display_name: cachedProfile.display_name,
          picture: cachedProfile.picture,
          nip05: cachedProfile.nip05,
          about: cachedProfile.about
        });
        setIsLoading(false);
        return;
      }
      
      // Make sure we're connected to relays
      await nostrService.connectToUserRelays();
      
      const profile = await nostrService.getUserProfile(nostrService.publicKey);
      if (profile) {
        setUserProfile({
          name: profile.name,
          display_name: profile.display_name,
          picture: profile.picture,
          nip05: profile.nip05,
          about: profile.about
        });
        
        // Cache the profile with high importance
        contentCache.cacheProfile(nostrService.publicKey, profile, true);
        setLastRefreshTime(Date.now());
      } else {
        throw new Error("Failed to load profile");
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
      
      // Show toast only on first error
      if (retryCount === 0) {
        toast({
          title: "Profile error",
          description: "Failed to load your profile",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, retryCount, lastRefreshTime]);
  
  // Retry handler
  const handleRetry = React.useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);
  
  // Force profile refresh when route changes, user logs in, or after retry
  React.useEffect(() => {
    fetchUserProfile();
    
    // Set up an interval to periodically refresh the profile
    const intervalId = setInterval(() => {
      if (isLoggedIn) {
        fetchUserProfile();
      }
    }, 120000); // 2 minutes
    
    return () => clearInterval(intervalId);
  }, [fetchUserProfile, isLoggedIn, retryCount]);
  
  return { 
    isLoggedIn, 
    userProfile, 
    isLoading, 
    error, 
    onRetry: handleRetry 
  };
}
