import { useEffect, useState, useCallback, useRef } from "react";
import { Event } from "nostr-tools";
import { useRelayContext } from "@/contexts/RelayContext";
import { useProfileContext } from "@/contexts/ProfileContext";
import { useSettings } from "@/hooks/useSettings";
import { useNostr } from "@/hooks/useNostr";
import { Filter } from "nostr-tools";

interface UseEventSubscriptionProps {
  filters: Filter[];
  relays?: string[];
  enabled?: boolean;
  onEvent?: (event: Event) => void;
  cacheKey?: string;
}

export function useEventSubscription({
  filters,
  relays: overrideRelays,
  enabled = true,
  onEvent,
  cacheKey,
}: UseEventSubscriptionProps) {
  const { getRelays } = useRelayContext();
  const { addEventToCache } = useProfileContext();
  const { subscribe, unsubscribe } = useNostr();
  const { settings } = useSettings();

  const [events, setEvents] = useState<Event[]>([]);
  const subscriptionId = useRef<string | null>(null);

  const relays = overrideRelays || getRelays(settings.defaultRelays);

  const memoizedOnEvent = useCallback(
    (event: Event) => {
      setEvents((prevEvents) => {
        if (prevEvents.find((e) => e.id === event.id)) {
          return prevEvents;
        }
        return [...prevEvents, event];
      });
      addEventToCache(event);
      onEvent?.(event);
    },
    [addEventToCache, onEvent]
  );

  useEffect(() => {
    if (!enabled || filters.length === 0) {
      return;
    }

    const subscribeToRelays = async () => {
      try {
        const subId = subscribe(filters, (event) => {
          memoizedOnEvent(event);
        });
        subscriptionId.current = subId;
      } catch (error) {
        console.error("Error subscribing to events:", error);
      }
    };

    subscribeToRelays();

    return () => {
      if (subscriptionId.current) {
        unsubscribe(subscriptionId.current);
        subscriptionId.current = null;
      }
    };
  }, [enabled, filters, relays, memoizedOnEvent, subscribe, unsubscribe]);

  return { events };
}
