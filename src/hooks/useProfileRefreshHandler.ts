
import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { nostrService } from "@/lib/nostr";
import { forceRefreshProfile } from "@/components/you/profile/profileUtils";

interface UseProfileRefreshHandlerProps {
  currentUserPubkey: string | null;
  refreshProfile: () => Promise<void>;
  profileSavedTimeRef: React.MutableRefObject<number | null>;
  refreshTimeoutRef: React.MutableRefObject<number | null>;
}

export function useProfileRefreshHandler({
  currentUserPubkey,
  refreshProfile,
  profileSavedTimeRef,
  refreshTimeoutRef
}: UseProfileRefreshHandlerProps) {
  const [refreshing, setRefreshing] = useState(false);
  const refreshAttemptRef = useRef(0);
  const maxAttempts = 3;

  const handleRefreshProfile = async () => {
    if (refreshing) {
      console.log("[PROFILE REFRESH] Refresh already in progress");
      return;
    }

    try {
      setRefreshing(true);
      toast.loading("Refreshing profile...");
      
      // Reset the attempt counter
      refreshAttemptRef.current = 0;
      
      // Try to refresh with retry logic
      await refreshWithRetry();
      
      toast.success("Profile refreshed successfully");
    } catch (error) {
      console.error("[PROFILE REFRESH] Error refreshing profile:", error);
      toast.error("Failed to refresh profile");
    } finally {
      setRefreshing(false);
    }
  };

  // Helper function to handle refresh with retries
  const refreshWithRetry = async (): Promise<boolean> => {
    if (!currentUserPubkey) return false;
    
    try {
      console.log(`[PROFILE REFRESH] Forcing refresh for ${currentUserPubkey}, attempt ${refreshAttemptRef.current + 1}/${maxAttempts}`);
      
      // Check relay connections first
      const relays = nostrService.getRelayStatus();
      const connectedRelays = relays.filter(r => r.status === 'connected');
      
      if (connectedRelays.length === 0) {
        console.log("[PROFILE REFRESH] No connected relays, attempting to connect...");
        await nostrService.connectToDefaultRelays();
      }
      
      // Try to force refresh the profile
      const refreshResult = await forceRefreshProfile(currentUserPubkey);
      
      if (refreshResult) {
        await refreshProfile();
        return true;
      }
      
      // If we failed but have more attempts left, try again
      refreshAttemptRef.current++;
      if (refreshAttemptRef.current < maxAttempts) {
        console.log(`[PROFILE REFRESH] Retry attempt ${refreshAttemptRef.current}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        return refreshWithRetry();
      }
      
      return false;
    } catch (error) {
      console.error("[PROFILE REFRESH] Error in refresh attempt:", error);
      
      // Try again if we have attempts left
      refreshAttemptRef.current++;
      if (refreshAttemptRef.current < maxAttempts) {
        console.log(`[PROFILE REFRESH] Retry attempt ${refreshAttemptRef.current}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        return refreshWithRetry();
      }
      
      return false;
    }
  };

  const handleProfileSaved = useCallback(async () => {
    console.log("[YOU PAGE] Profile saved, exiting edit mode");

    const shouldRefresh = !profileSavedTimeRef.current || 
                          (Date.now() - profileSavedTimeRef.current) > 2000;

    if (shouldRefresh) {
      console.log("[YOU PAGE] Setting timeout to refresh profile after save");

      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          console.log("[YOU PAGE] Starting profile refresh after save");
          setRefreshing(true);

          // Slightly longer delay for relay propagation
          await new Promise(resolve => setTimeout(resolve, 2500));
          
          // Reset retry counter
          refreshAttemptRef.current = 0;
          
          if (currentUserPubkey) {
            await refreshWithRetry();
          }
        } catch (error) {
          console.error("[YOU PAGE] Error refreshing after save:", error);
        } finally {
          setRefreshing(false);
        }
      }, 3000);
    }
  }, [currentUserPubkey, refreshProfile, profileSavedTimeRef, refreshTimeoutRef]);

  return {
    refreshing,
    handleRefreshProfile,
    handleProfileSaved,
    setRefreshing
  };
}
