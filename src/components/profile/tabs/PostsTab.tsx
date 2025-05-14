import React, { useState, useEffect, useRef, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Event } from "nostr-tools";
import { nip19 } from "nostr-tools";
import { toast } from "@/components/ui/use-toast";
import { useInView } from "react-intersection-observer";
import { useProfile } from "@/hooks/useProfile";
import { NoteCard } from "@/components/NoteCard";

interface PostsTabProps {
  npub: string;
}

const fetchPosts = async (pubkey: string, cursor: string | null) => {
  const filter = {
    authors: [pubkey],
    kinds: [1],
    limit: 20,
    ...(cursor ? { until: parseInt(cursor) } : {}),
  };

  try {
    const events = await window.nostr.getRelayPool().list(undefined, [filter]);
    return events;
  } catch (error) {
    console.error("Error fetching posts:", error);
    toast({
      title: "Error",
      description: "Failed to fetch posts.",
    });
    return [];
  }
};

const PostsTab: React.FC<PostsTabProps> = ({ npub }) => {
  const { data: profile } = useProfile(npub);
  const pubkey = profile?.pubkey;
  const [events, setEvents] = useState<Event[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);

  const { ref: loadMoreRef, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    error,
  } = useInfiniteQuery(
    ["posts", pubkey],
    async ({ pageParam }) => {
      if (!pubkey) return [];
      const posts = await fetchPosts(pubkey, pageParam as string | null);
      return posts;
    },
    {
      getNextPageParam: (lastPage) => {
        if (!lastPage || lastPage.length === 0) return undefined;
        const lastEvent = lastPage[lastPage.length - 1];
        return lastEvent.created_at.toString();
      },
      enabled: !!pubkey,
    }
  );

  useEffect(() => {
    if (data) {
      const allEvents = data.pages.flat();
      setEvents(allEvents);
    }
  }, [data]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage, isFetchingNextPage]);

  return (
    <div>
      {events.map((event) => (
        <NoteCard key={event.id} event={event} />
      ))}
      <div ref={loadMoreRef} className="py-2 text-center">
        {loadMoreLoading ? (
          <div className="flex items-center justify-center py-4">
            <span className="text-sm text-muted-foreground">Loading more posts...</span>
          </div>
        ) : (
          <div className="h-8">{/* Spacer for intersection observer */}</div>
        )}
      </div>
    </div>
  );
};

export default PostsTab;
