
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
  let isRefreshing = false;

  const handleRefreshProfile = async () => {
    if (isRefreshing) {
      console.log("[PROFILE REFRESH] Refresh already in progress");
      return;
    }

    isRefreshing = true;

    try {
      console.log(`[PROFILE REFRESH] Forcing refresh for ${currentUserPubkey}`);
      const refreshResult = await forceRefreshProfile(currentUserPubkey);

      if (!refreshResult) {
        console.log("[PROFILE REFRESH] Initial refresh failed, reconnecting relays");
        await nostrService.connectToDefaultRelays();
        await forceRefreshProfile(currentUserPubkey);
      }

      await refreshProfile();
      toast.success("Profile refreshed successfully");
    } catch (error) {
      console.error("[PROFILE REFRESH] Error refreshing profile:", error);
      toast.error("Failed to refresh profile");
    } finally {
      isRefreshing = false;
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

          await new Promise(resolve => setTimeout(resolve, 1500));

          if (currentUserPubkey) {
            console.log(`[YOU PAGE] Forcing refresh for pubkey: ${currentUserPubkey}`);
            const refreshResult = await forceRefreshProfile(currentUserPubkey);

            if (!refreshResult) {
              console.log("[YOU PAGE] Initial refresh failed, trying to reconnect relays");
              await nostrService.connectToDefaultRelays();
              await forceRefreshProfile(currentUserPubkey);
            }

            await refreshProfile();
          }
        } catch (error) {
          console.error("[YOU PAGE] Error refreshing after save:", error);
        } finally {
          setRefreshing(false);
        }
      }, 2500);
    }
  }, [currentUserPubkey, refreshProfile, profileSavedTimeRef, refreshTimeoutRef]);

  return {
    refreshing,
    handleRefreshProfile,
    handleProfileSaved,
    setRefreshing
  };
}
