import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { NostrEvent, nostrService, contentCache, NostrProfileMetadata } from '@/lib/nostr';
import { useUserProfiles } from '@/hooks/queries/useProfileQueries';

interface UseProfileLikesProps {
  hexPubkey: string | undefined;
  enabled?: boolean;
}

export function useProfileLikes({ hexPubkey, enabled = true }: UseProfileLikesProps) {
  const [reactions, setReactions] = useState<NostrEvent[]>([]);
  const [referencedEvents, setReferencedEvents] = useState<Record<string, NostrEvent>>({});
  const [loadingInitialData, setLoadingInitialData] = useState(false);
  const subscriptionsRef = useRef<Set<string>>(new Set());
  const timeoutRef = useRef<number | null>(null);
  const isMounted = useRef(true);

  // Set up the mounted ref for cleanup
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Helper to fetch events that were reacted to
  const fetchReferencedEvent = useCallback((eventId: string) => {
    if (referencedEvents[eventId]) return;

    const cachedEvent = contentCache.getEvent(eventId);
    if (cachedEvent) {
      if (isMounted.current) {
        setReferencedEvents(prev => ({
          ...prev,
          [eventId]: cachedEvent
        }));
      }
      return;
    }

    const subId = nostrService.subscribe(
      [
        {
          ids: [eventId],
          kinds: [1],
          limit: 1
        }
      ],
      (event) => {
        if (!event || !isMounted.current) return;

        contentCache.cacheEvent(event);

        setReferencedEvents(prev => ({
          ...prev,
          [eventId]: event
        }));
      }
    );

    // Track subscription for cleanup
    subscriptionsRef.current.add(subId);

    // Cleanup subscription after a short time
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const timeoutId = window.setTimeout(() => {
      if (subscriptionsRef.current.has(subId) && isMounted.current) {
        nostrService.unsubscribe(subId);
        subscriptionsRef.current.delete(subId);
      }
    }, 2000);
  }, [referencedEvents]); // Dependencies for fetchReferencedEvent

  useEffect(() => {
    if (!enabled || !hexPubkey) return;

    console.log("Fetching likes for profile:", hexPubkey);
    setLoadingInitialData(true);
    setReactions([]);
    setReferencedEvents({});

    // Capture the current value of the ref for use in the cleanup function
    const currentSubscriptions = subscriptionsRef.current;

    // Clean up previous subscriptions if any
    currentSubscriptions.forEach(subId => {
      nostrService.unsubscribe(subId);
    });
    currentSubscriptions.clear();

    const reactionsSubId = nostrService.subscribe(
      [
        {
          kinds: [7],
          authors: [hexPubkey],
          limit: 50
        }
      ],
      (event) => {
        if (!isMounted.current) return;

        setReactions(prev => {
          if (prev.some(e => e.id === event.id)) {
            return prev;
          }
          return [...prev, event].sort((a, b) => b.created_at - a.created_at);
        });

        const reactedEventId = getReactedToEventId(event);
        if (reactedEventId) {
          fetchReferencedEvent(reactedEventId);
        }
      }
    );

    currentSubscriptions.add(reactionsSubId);

    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      if (isMounted.current) {
        setLoadingInitialData(false);
      }
    }, 3000);

    return () => {
      currentSubscriptions.forEach(subId => {
        nostrService.unsubscribe(subId);
      });
      currentSubscriptions.clear();

      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [hexPubkey, enabled, fetchReferencedEvent]); // Added fetchReferencedEvent to dependencies

  // Helper to extract event ID from NIP-25 reaction
  const getReactedToEventId = (event: NostrEvent): string | null => {
    // According to NIP-25, 'e' tag points to the event being reacted to
    if (event.tags && Array.isArray(event.tags)) {
      const eTag = event.tags.find(tag =>
        Array.isArray(tag) && tag.length >= 2 && tag[0] === 'e'
      );

      return eTag ? eTag[1] : null;
    }
    return null;
  };

  const authorPubkeys = useMemo(() => {
    return Object.values(referencedEvents)
      .map(event => event.pubkey)
      .filter((pubkey, index, self) => pubkey && self.indexOf(pubkey) === index);
  }, [referencedEvents]);

  const profileQueryResults = useUserProfiles(authorPubkeys, { enabled: authorPubkeys.length > 0 });

  const { profilesMap, isLoadingProfiles } = useMemo(() => {
    const newProfilesMap: Record<string, NostrProfileMetadata | null | undefined> = {};
    let anyProfileLoading = false;
    if (authorPubkeys.length > 0) {
      profileQueryResults.forEach((result, index) => {
        const pubkey = authorPubkeys[index];
        if (!pubkey) return;

        if (result.isLoading) {
          anyProfileLoading = true;
        }
        if (result.isSuccess) {
          newProfilesMap[pubkey] = result.data;
        } else if (result.isError) {
          newProfilesMap[pubkey] = null;
          console.error(`[useProfileLikes] Error fetching profile for ${pubkey}:`, result.error);
        } else if (!result.isLoading) {
          if (!(pubkey in newProfilesMap)) {
            newProfilesMap[pubkey] = undefined;
          }
        }
      });
    }
    return { profilesMap: newProfilesMap, isLoadingProfiles: anyProfileLoading };
  }, [profileQueryResults, authorPubkeys]);

  return {
    reactions,
    referencedEvents,
    profilesMap,
    loading: loadingInitialData,
    isLoadingProfiles,
  };
}
