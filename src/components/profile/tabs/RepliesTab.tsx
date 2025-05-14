import React, { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Event } from 'nostr-tools';
import { nip19 } from 'nostr-tools';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useInView } from 'react-intersection-observer';
import { useProfile } from '@/hooks/useProfile';
import { NoteCard } from '@/components/NoteCard';
import { ProfilePostsParams } from '@/lib/nostr/profile';
import { getProfilePosts } from '@/lib/nostr/profile';

interface RepliesTabProps {
  npub: string;
}

const RepliesTab: React.FC<RepliesTabProps> = ({ npub }) => {
  const [searchParams] = useSearchParams();
  const { profile } = useProfile({ npub });
  const pubkey = profile?.pubkey || '';
  const [limit, setLimit] = useState(20);
  const [eventIds, setEventIds] = useState<string[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);

  const { ref, inView } = useInView({
    threshold: 0,
  });

  const fetchReplies = async ({ pageParam }: { pageParam?: string }) => {
    if (!pubkey) {
      return { events: [], next: undefined };
    }

    const params: ProfilePostsParams = {
      pubkey: pubkey,
      limit: limit,
      offset: pageParam,
      replyTo: eventIds,
    };

    try {
      const { events, next } = await getProfilePosts(params);
      return { events: events, next: next };
    } catch (error: any) {
      toast.error(`Failed to fetch replies: ${error.message}`);
      return { events: [], next: undefined };
    }
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery(
    ['profileReplies', pubkey, limit, eventIds],
    fetchReplies,
    {
      getNextPageParam: (lastPage) => lastPage.next,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      setLoadMoreLoading(true);
      fetchNextPage().finally(() => setLoadMoreLoading(false));
    }
  }, [inView, hasNextPage, fetchNextPage, isFetchingNextPage]);

  useEffect(() => {
    if (data) {
      const newEvents = data.pages.flatMap((page) => page.events);
      setAllEvents((prevEvents) => [...prevEvents, ...newEvents]);
    }
  }, [data]);

  const loadMoreRef = useRef(null);

  return (
    <div>
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <span className="text-sm text-muted-foreground">Loading replies...</span>
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center py-4">
          <span className="text-sm text-muted-foreground">Error: {error.message}</span>
        </div>
      ) : allEvents.length === 0 ? (
        <div className="flex items-center justify-center py-4">
          <span className="text-sm text-muted-foreground">No replies found.</span>
        </div>
      ) : (
        <div>
          {allEvents.map((event) => (
            <NoteCard key={event.id} event={event} />
          ))}
        </div>
      )}

      <div ref={loadMoreRef} className="py-2 text-center">
        {loadMoreLoading ? (
          <div className="flex items-center justify-center py-4">
            <span className="text-sm text-muted-foreground">Loading more replies...</span>
          </div>
        ) : (
          <div className="h-8">{/* Spacer for intersection observer */}</div>
        )}
      </div>
    </div>
  );
};

export default RepliesTab;
