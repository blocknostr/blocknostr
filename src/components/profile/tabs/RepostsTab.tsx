import React, { useState, useEffect, useRef, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Event } from "nostr-tools";
import { nip19 } from "nostr-tools";
import { toast } from "sonner";

import { useProfile } from "@/hooks/useProfile";
import { getReposts } from "@/lib/nostr/profile";
import { NoteCard } from "@/components/NoteCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface RepostsTabProps {
  npub: string;
}

const RepostsTab: React.FC<RepostsTabProps> = ({ npub }) => {
  const { profile } = useProfile({ npub });
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [limit, setLimit] = useState(20);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (profile) {
      try {
        const { data } = nip19.decode(npub);
        setPubkey(data as string);
      } catch (e) {
        console.error("Error decoding npub:", e);
        toast.error("Failed to decode profile ID");
      }
    }
  }, [profile, npub]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery(
    ["reposts", pubkey, limit],
    async ({ pageParam = null }) => {
      if (!pubkey) {
        return { events: [], eose: true };
      }
      return getReposts(pubkey, limit, pageParam as string | null);
    },
    {
      getNextPageParam: (lastPage) => {
        if (lastPage.eose) {
          return undefined;
        }
        try {
          const lastEvent = lastPage.events[lastPage.events.length - 1];
          return lastEvent?.id || null;
        } catch (e) {
          console.error("Error getting last event id:", e);
          return null;
        }
      },
      enabled: !!pubkey,
    }
  );

  const events = data?.pages?.map((page) => page.events).flat() || [];
  const loadMoreLoading = isFetchingNextPage || isLoading;
  const hasMore = !!hasNextPage;

  const observer = useRef<IntersectionObserver | null>(null);

  const loadMore = useCallback(() => {
    if (hasMore && !loadMoreLoading) {
      fetchNextPage();
    }
  }, [hasMore, loadMoreLoading, fetchNextPage]);

  useEffect(() => {
    if (loadMoreRef.current) {
      observer.current = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore && !loadMoreLoading) {
            loadMore();
          }
        });
      });

      observer.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [loadMoreRef, loadMore, hasMore, loadMoreLoading]);

  if (!pubkey) {
    return <div className="py-4">Loading profile...</div>;
  }

  if (isError) {
    return <div className="py-4">Error: {error.message}</div>;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 py-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-10rem)] w-full pb-2">
      <div className="relative">
        {events.map((event: Event) => (
          <NoteCard key={event.id} event={event} />
        ))}
        <div ref={loadMoreRef} className="py-2 text-center">
          {loadMoreLoading ? (
            <div className="flex items-center justify-center py-4">
              <span className="text-sm text-muted-foreground">Loading more reposts...</span>
            </div>
          ) : (
            <div className="h-8">{/* Spacer for intersection observer */}</div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
};

export default RepostsTab;
