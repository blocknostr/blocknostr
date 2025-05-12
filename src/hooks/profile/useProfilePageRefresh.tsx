
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { retry } from "@/lib/utils/retry";
import { nostrService } from "@/lib/nostr";
import { relaySelector } from "@/lib/nostr/relay/selection/relay-selector";

export function useProfilePageRefresh(
  relays: any[], 
  connectToRelays: () => Promise<void>,
  refreshRelays: () => void,
  refreshProfile: () => Promise<void>
) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    toast.loading("Refreshing profile data...");

    try {
      await connectToRelays();
      await retry(
        async () => {
          const readRelays = relaySelector.selectBestRelays(
            relays.map((r) => r.url),
            { operation: "read", count: 5 }
          );
          if (readRelays.length) {
            await nostrService.addMultipleRelays(readRelays);
          }
          // fallback relays
          await nostrService.addMultipleRelays([
            "wss://relay.damus.io",
            "wss://nos.lol",
            "wss://relay.nostr.band",
            "wss://relay.snort.social",
          ]);
          refreshRelays();
          await refreshProfile();
          return true;
        },
        {
          maxAttempts: 2,
          baseDelay: 2000,
          onRetry: () => toast.info("Retrying profile refresh..."),
        }
      );
      toast.success("Profile refreshed");
    } catch (err) {
      console.error("Error refreshing profile:", err);
      toast.error("Failed to refresh profile");
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, connectToRelays, refreshRelays, refreshProfile, relays]);

  return {
    refreshing,
    handleRefresh
  };
}
