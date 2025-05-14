import { useState, useEffect, useCallback } from "react";
import { NostrEvent, nostrService, contentCache } from "@/lib/nostr";
import { useProfileFetcher } from "./use-profile-fetcher";
import { useEventSubscription } from "./use-event-subscription";
import { useRepostHandler } from "./use-repost-handler";
import { EventDeduplication } from "@/lib/nostr/utils/event-deduplication";
import { toast } from "sonner";

interface UseFeedEventsProps {
  following?: string[];
  since?: number;
  until?: number;
  activeHashtag?: string;
  limit?: number;
  feedType?: string;
  mediaOnly?: boolean;
}

export function useFeedEvents({
  following,
  since,
  until,
  activeHashtag,
  limit = 50,
  feedType = 'generic',
  mediaOnly = false
}: UseFeedEventsProps) {
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [authorPubkeysToFetch, setAuthorPubkeysToFetch] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [cacheHit, setCacheHit] = useState<boolean>(false);
  const [loadingFromCache, setLoadingFromCache] = useState<boolean>(false);

  const { profiles } = useProfileFetcher({ pubkeys: authorPubkeysToFetch });

  const requestProfileFetch = useCallback((pubkey: string) => {
    if (pubkey && !authorPubkeysToFetch.includes(pubkey)) {
      setAuthorPubkeysToFetch(prevPubkeys => [...new Set([...prevPubkeys, pubkey])]);
    }
  }, [authorPubkeysToFetch]);

  const { repostData, handleRepost } = useRepostHandler({ requestProfileFetch });

  useEffect(() => {
    const newPubkeys = new Set<string>();
    events.forEach(event => {
      if (event.pubkey) {
        newPubkeys.add(event.pubkey);
      }
      event.tags?.forEach(tag => {
        if (tag[0] === 'p' && tag[1]) {
          newPubkeys.add(tag[1]);
        }
      });
    });
    setAuthorPubkeysToFetch(prev => [...new Set([...prev, ...Array.from(newPubkeys)])]);
  }, [events]);

  const { subId, setSubId, setupSubscription } = useEventSubscription({
    following,
    activeHashtag,
    since,
    until,
    limit,
    setEvents,
    handleRepost,
    requestProfileFetch,
    feedType,
    mediaOnly,
  });

  useEffect(() => {
    const loadFromCache = async () => {
      setLoadingFromCache(true);
      const cachedFeed = contentCache.getFeed(feedType, {
        authorPubkeys: following,
        hashtag: activeHashtag,
        since,
        until,
        mediaOnly
      });

      if (cachedFeed && cachedFeed.length > 0) {
        setEvents(cachedFeed);
        setCacheHit(true);
        const cacheKey = contentCache.feedCache.generateCacheKey(feedType, {
          authorPubkeys: following,
          hashtag: activeHashtag,
          since,
          until,
          mediaOnly
        });
        const cacheEntry = contentCache.feedCache.getRawEntry(cacheKey);
        if (cacheEntry) {
          setLastUpdated(new Date(cacheEntry.timestamp));
        }
        const uniqueAuthors = new Set<string>();
        cachedFeed.forEach(event => {
          if (event.pubkey) {
            uniqueAuthors.add(event.pubkey);
          }
          event.tags?.forEach(tag => {
            if (tag[0] === 'p' && tag[1]) {
              uniqueAuthors.add(tag[1]);
            }
          });
        });
        setAuthorPubkeysToFetch(prev => [...new Set([...prev, ...Array.from(uniqueAuthors)])]);
      }
      setLoadingFromCache(false);
    };
    loadFromCache();
  }, [feedType, following, activeHashtag, since, until, mediaOnly, requestProfileFetch]);

  const refreshFeed = () => {
    contentCache.feedCache.clearFeed(feedType, {
      authorPubkeys: following,
      hashtag: activeHashtag,
      since,
      until,
      mediaOnly
    });
    setCacheHit(false);
    setLastUpdated(null);
    if (subId) {
      nostrService.unsubscribe(subId);
      setSubId(null);
    }
    const currentTime = Math.floor(Date.now() / 1000);
    const newSince = currentTime - 24 * 60 * 60;
    toast.info("Refreshing feed...");
    const newSubId = setupSubscription(newSince, currentTime);
    setSubId(newSubId);
  };

  return {
    events,
    profiles,
    repostData,
    subId,
    setSubId,
    setupSubscription,
    setEvents,
    refreshFeed,
    lastUpdated,
    cacheHit,
    loadingFromCache
  };
}
