
import { useState } from "react";
import { NostrEvent } from "@/lib/nostr";
import { useProfileFetcher } from "./use-profile-fetcher";
import { useEventSubscription } from "./use-event-subscription";
import { useRepostHandler } from "./use-repost-handler";

interface UseFeedEventsProps {
  following: string[];
  since?: number;
  until?: number;
  activeHashtag?: string;
  limit?: number;
}

export function useFeedEvents({
  following,
  since,
  until,
  activeHashtag,
  limit = 50
}: UseFeedEventsProps) {
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const { profiles, fetchProfileData } = useProfileFetcher();
  const { repostData, handleRepost } = useRepostHandler({ fetchProfileData });
  
  // Handle event subscription
  const { subId, setSubId, setupSubscription } = useEventSubscription({
    following,
    activeHashtag,
    limit,
    setEvents,
    handleRepost,
    fetchProfileData,
  });

  return {
    events,
    profiles,
    repostData,
    subId,
    setSubId,
    setupSubscription,
    setEvents
  };
}
