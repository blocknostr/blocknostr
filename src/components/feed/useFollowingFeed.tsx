
import { useState, useEffect, useCallback } from 'react';
import { NostrEvent, EVENT_KINDS } from '@/lib/nostr';
import { adaptedNostrService as nostrService } from '@/lib/nostr/nostr-adapter';
import { useRetry } from '@/lib/retry';

export function useFollowingFeed() {
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Get following from adapter
  const following = nostrService.following || [];

  const { retry } = useRetry({ maxRetries: 3, baseDelay: 1000 });

  const loadEvents = useCallback(async () => {
    if (!nostrService.publicKey) {
      setLoading(false);
      setError("You must be logged in to view your feed");
      return;
    }

    if (following.length === 0) {
      setLoading(false);
      setError("You're not following anyone yet");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Connect to relays
      await nostrService.connectToUserRelays();

      // Get events from following
      const filters = [{
        kinds: [EVENT_KINDS.TEXT_NOTE],
        authors: following,
        limit: 50,
        since: Math.floor(Date.now() / 1000) - 86400 * 7 // Last week
      }];

      const subId = nostrService.subscribe(filters, (event) => {
        setEvents((prev) => {
          // Check if we already have this event
          if (prev.some(e => e.id === event.id)) {
            return prev;
          }

          // Add new event and sort by timestamp
          return [...prev, event].sort((a, b) => b.created_at - a.created_at);
        });

        // Set loading to false once we get at least some events
        setLoading(false);
      });

      // Set a timeout to stop loading if no events received
      setTimeout(() => {
        if (loading) {
          setLoading(false);
          if (events.length === 0) {
            setError("No recent posts from people you follow");
          }
        }

        // Clean up subscription
        nostrService.unsubscribe(subId);
      }, 10000);
    } catch (err) {
      console.error("Error loading following feed:", err);
      setError("Failed to load posts from following");
      setLoading(false);
      retry(loadEvents);
    }
  }, [nostrService.publicKey, following, loading, events.length, retry]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const refreshFeed = useCallback(() => {
    setEvents([]);
    loadEvents();
  }, [loadEvents]);

  return {
    events,
    loading,
    error,
    refreshFeed,
  };
}

export default useFollowingFeed;
