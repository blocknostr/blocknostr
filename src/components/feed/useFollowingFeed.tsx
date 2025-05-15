import { useCallback, useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { adaptedNostrService as nostrService } from "@/lib/nostr";
import { EVENT_KINDS, NostrEvent } from "@/lib/nostr";
import { useUser } from "@/hooks/use-user";
import { useRelayContext } from "@/components/providers/relay-provider";

const LIMIT = 20;

export function useFollowingFeed() {
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "connecting" | "disconnected"
  >("connecting");
  const [connectError, setConnectError] = useState<string | null>(null);
  const { relays } = useRelayContext();
  const { user } = useUser();

  const updateConnectionStatus = useCallback(() => {
    const relays = nostrService.getRelayStatus();
    // Convert statuses to strings for safe comparison
    const connected = relays.filter(r => {
      return String(r.status) === "1" || r.status === "connected";
    }).length;
    
    if (connected > 0) {
      setConnectionStatus('connected');
      setConnectError(null);
    } else if (relays.length === 0 || !navigator.onLine) {
      setConnectionStatus('disconnected');
    } else {
      setConnectionStatus('connecting');
    }
  }, []);

  useEffect(() => {
    updateConnectionStatus();

    const interval = setInterval(updateConnectionStatus, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [updateConnectionStatus]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    isLoading,
  } = useInfiniteQuery(
    ["followingFeed", user?.pubkey],
    async ({ pageParam = undefined }) => {
      if (!user?.pubkey) {
        return { events: [], hasNext: false };
      }

      try {
        const following = nostrService.social.socialManager.following;

        if (!following.length) {
          return { events: [], hasNext: false };
        }

        const filters = [
          {
            kinds: [EVENT_KINDS.TEXT_NOTE, EVENT_KINDS.REPOST],
            authors: following,
            limit: LIMIT,
            ...(pageParam ? { until: pageParam } : {}),
          },
        ];

        const events = await nostrService.data.getEvents(filters);

        const oldestEvent = events.reduce((prev, curr) => {
          return prev.created_at < curr.created_at ? prev : curr;
        }, events[0]);

        return {
          events,
          hasNext: events.length === LIMIT,
          nextUntil: oldestEvent?.created_at,
        };
      } catch (error) {
        console.error("Error fetching following feed:", error);
        toast({
          title: "Something went wrong!",
          description: "Failed to load following feed.",
          duration: 3000,
        });
        return { events: [], hasNext: false };
      }
    },
    {
      getNextPageParam: (lastPage) => {
        if (lastPage.hasNext) {
          return lastPage.nextUntil;
        }
        return undefined;
      },
      enabled: !!user?.pubkey && connectionStatus === "connected",
    }
  );

  return {
    events: data?.pages.flatMap((page) => page.events) ?? [],
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    isError,
    isLoading,
    connectionStatus,
    connectError,
  };
}
