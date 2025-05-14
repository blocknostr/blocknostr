import React, { useState, useEffect, useRef } from "react";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { nostrService } from "@/lib/nostr";
import { useProfileFeed } from "../hooks/useProfileFeed";
import NoteCard from "@/components/NoteCard";

interface LikesTabProps {
  npub: string;
}

const LikesTab: React.FC<LikesTabProps> = ({ npub }) => {
  const [since, setSince] = useState<number | undefined>(undefined);
  const [until, setUntil] = useState(Math.floor(Date.now() / 1000));
  const { events, profiles, repostData, subId, setSubId, setupSubscription, setEvents } = useProfileFeed({
    npub,
    since,
    until,
    kind: 7, // Kind 7 is for likes
  });

  const loadMoreEvents = () => {
    if (!subId) return;

    // Close previous subscription
    if (subId) {
      nostrService.unsubscribe(subId);
    }

    // Create new subscription with older timestamp range
    if (!since) {
      const oldestEvent =
        events.length > 0
          ? events.reduce((oldest, current) => (oldest.created_at < current.created_at ? oldest : current))
          : null;

      const newUntil = oldestEvent ? oldestEvent.created_at - 1 : until - 24 * 60 * 60;
      const newSince = newUntil - 24 * 60 * 60; // 24 hours before until

      setSince(newSince);
      setUntil(newUntil);

      const newSubId = setupSubscription(newSince, newUntil);
      setSubId(newSubId);
    } else {
      const newUntil = since;
      const newSince = newUntil - 24 * 60 * 60;

      setSince(newSince);
      setUntil(newUntil);

      const newSubId = setupSubscription(newSince, newUntil);
      setSubId(newSubId);
    }
  };

  const { loadMoreRef, loading: loadMoreLoading, hasMore, setHasMore } = useInfiniteScroll(loadMoreEvents, {
    initialLoad: true,
  });

  useEffect(() => {
    const initFeed = async () => {
      // Reset state when filter changes
      setEvents([]);
      setHasMore(true);

      // Reset the timestamp range for new subscription
      const currentTime = Math.floor(Date.now() / 1000);
      setSince(undefined);
      setUntil(currentTime);

      if (subId) {
        nostrService.unsubscribe(subId);
      }

      const newSubId = setupSubscription(currentTime - 24 * 60 * 60, currentTime);
      setSubId(newSubId);
    };

    initFeed();

    return () => {
      if (subId) {
        nostrService.unsubscribe(subId);
      }
    };
  }, [npub]);

  return (
    <div>
      {events.map((event) => (
        <NoteCard
          key={event.id}
          event={event}
          profileData={event.pubkey ? profiles[event.pubkey] : undefined}
          repostData={
            event.id && repostData[event.id]
              ? {
                  reposterPubkey: repostData[event.id].pubkey,
                  reposterProfile: repostData[event.id].pubkey ? profiles[repostData[event.id].pubkey] : undefined,
                }
              : undefined
          }
        />
      ))}
      <div ref={loadMoreRef} className="py-2 text-center">
        {loadMoreLoading ? (
          <div className="flex items-center justify-center py-4">
            <span className="text-sm text-muted-foreground">Loading more likes...</span>
          </div>
        ) : (
          <div className="h-8">{/* Spacer for intersection observer */}</div>
        )}
      </div>
    </div>
  );
};

export default LikesTab;
