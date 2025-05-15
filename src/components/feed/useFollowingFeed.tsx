
import { useCallback, useEffect, useState, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useInView } from "react-intersection-observer";

import { nostrService, EVENT_KINDS, NostrEvent } from "@/lib/nostr";
import { useUser } from "@/hooks/use-user";
import { useRelayContext } from "@/components/providers/relay-provider";
import { useUnifiedProfileFetcher } from "@/hooks/useUnifiedProfileFetcher";
import { useRepostHandler } from "./hooks/use-repost-handler";

const LIMIT = 20;

export function useFollowingFeed({ activeHashtag }: { activeHashtag?: string }) {
  // For infinite scroll
  const { ref: loadMoreRef, inView } = useInView();
  
  // Connection status
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "connecting" | "disconnected"
  >("connecting");
  const [connectError, setConnectError] = useState<string | null>(null);
  const { relays } = useRelayContext();
  const { user } = useUser();
  
  // Data states
  const [following, setFollowing] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [cacheHit, setCacheHit] = useState<boolean>(false);
  const [loadingFromCache, setLoadingFromCache] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  
  // Profile and repost handling
  const { profiles, fetchProfiles } = useUnifiedProfileFetcher();
  const { repostData, handleRepost } = useRepostHandler({ fetchProfileData: fetchProfiles });

  // Update connection status
  const updateConnectionStatus = useCallback(() => {
    const relays = nostrService.getRelayStatus();
    // Convert statuses to strings for safe comparison
    const connected = relays.filter(r => {
      return r.status === 1 || String(r.status) === "1" || r.status === "connected";
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

  // Load following list
  useEffect(() => {
    if (user?.pubkey && nostrService.socialManager) {
      const following = nostrService.socialManager.following || [];
      setFollowing(following);
    }
  }, [user?.pubkey]);

  // Update connection status periodically
  useEffect(() => {
    updateConnectionStatus();
    const interval = setInterval(updateConnectionStatus, 5000);
    return () => clearInterval(interval);
  }, [updateConnectionStatus]);

  // Query for events
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["followingFeed", user?.pubkey, activeHashtag],
    queryFn: async ({ pageParam = undefined }) => {
      if (!user?.pubkey) {
        return { events: [], hasNext: false };
      }

      try {
        // If we have following list, query for their posts
        if (following.length === 0) {
          return { events: [], hasNext: false };
        }

        const filters = [
          {
            kinds: [EVENT_KINDS.TEXT_NOTE, EVENT_KINDS.REPOST],
            authors: following,
            limit: LIMIT,
            ...(activeHashtag ? { "#t": [activeHashtag] } : {}),
            ...(pageParam ? { until: pageParam } : {}),
          },
        ];

        const events = await nostrService.data.getEvents(filters);
        
        // Fetch profiles for the events
        const uniqueAuthors = new Set<string>();
        events.forEach(event => {
          if (event.pubkey) uniqueAuthors.add(event.pubkey);
          
          // If it's a repost, also get the original author
          if (event.kind === EVENT_KINDS.REPOST) {
            try {
              const tags = event.tags || [];
              const eventTag = tags.find(tag => tag[0] === 'e');
              const pubkeyTag = tags.find(tag => tag[0] === 'p');
              
              if (pubkeyTag && pubkeyTag[1]) {
                uniqueAuthors.add(pubkeyTag[1]);
              }
              
              // Process repost
              if (eventTag && eventTag[1] && pubkeyTag && pubkeyTag[1]) {
                handleRepost(event.id, pubkeyTag[1], eventTag[1]);
              }
            } catch (e) {
              console.error("Error processing repost:", e);
            }
          }
        });
        
        // Batch fetch profiles
        if (uniqueAuthors.size > 0) {
          fetchProfiles([...uniqueAuthors]);
        }

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
    getNextPageParam: (lastPage) => {
      if (lastPage.hasNext) {
        return lastPage.nextUntil;
      }
      return undefined;
    },
    enabled: !!user?.pubkey && connectionStatus === "connected" && following.length > 0,
  });

  // Load more when scrolled to bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Handle refresh feed
  const refreshFeed = useCallback(() => {
    setCacheHit(false);
    setLastUpdated(new Date());
    setIsRetrying(true);
    refetch().finally(() => {
      setIsRetrying(false);
    });
  }, [refetch]);

  // Load more events manually
  const loadMoreEvents = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Combine events from all pages
  const events = data?.pages.flatMap((page) => page.events) ?? [];

  return {
    events,
    profiles,
    repostData,
    loadMoreRef,
    loading: isLoading,
    following,
    refreshFeed,
    lastUpdated,
    cacheHit,
    loadingFromCache,
    loadingMore: isFetchingNextPage,
    hasMore: hasNextPage ?? false,
    loadMoreEvents,
    isRetrying,
    connectionStatus,
    connectError
  };
}
