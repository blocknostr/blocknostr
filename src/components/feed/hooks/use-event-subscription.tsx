import { useState, useEffect, useCallback } from 'react';
import { Event, Filter } from 'nostr-tools';
import { nostrService } from '@/lib/nostr';
import { useDebounce } from '@/hooks/use-debounce';

export interface NostrFilter extends Filter {
  search?: string;
}

interface EventSubscriptionOptions {
  debounce?: number;
  relayOverride?: string[];
}

export function useEventSubscription(filters: NostrFilter[], options: EventSubscriptionOptions = {}) {
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const debouncedFilters = useDebounce(filters, options.debounce || 500);
  
  // Function to get relay connection status
  const updateConnectionStatus = useCallback(() => {
    const relays = nostrService.getRelayStatus();
    // Convert statuses to strings for safe comparison
    const connected = relays.filter(r => {
      return String(r.status) === "1" || r.status === "connected";
    }).length;
    
    if (connected > 0) {
      setConnectionStatus('connected');
      setError(null);
    } else if (relays.length === 0 || !navigator.onLine) {
      setConnectionStatus('disconnected');
    } else {
      setConnectionStatus('connecting');
    }
  }, []);

  useEffect(() => {
    // Only attempt to subscribe if we are connected
    if (connectionStatus !== 'connected') {
      return;
    }
    
    setLoading(true);
    
    // Clean up any existing subscriptions
    subscriptions.forEach(subId => {
      if (subId) nostrService.unsubscribe(subId);
    });
    
    // Subscribe to events using the available API format
    const updateEvents = (event: Event) => {
      setEvents(prevEvents => {
        // Check if we already have this event
        if (prevEvents.some(e => e.id === event.id)) return prevEvents;
        
        // Add new event and sort by timestamp (newest first)
        const updatedEvents = [...prevEvents, event].sort((a, b) => b.created_at - a.created_at);
        return updatedEvents;
      });
    };
    
    // Subscribe to events
    const sub = nostrService.subscribe(
      debouncedFilters,
      updateEvents,
      options.relayOverride
    );
    
    setSubscriptions([sub]);
    setLoading(false);
    
    // Cleanup function
    return () => {
      if (sub) nostrService.unsubscribe(sub);
    };
  }, [debouncedFilters, connectionStatus, options.relayOverride]);
  
  // Setup connection status check interval
  useEffect(() => {
    // Set up connection status check interval
    const statusInterval = setInterval(updateConnectionStatus, 5000);
    
    // Cleanup function
    return () => {
      clearInterval(statusInterval);
    };
  }, [updateConnectionStatus]);

  return {
    events,
    loading,
    error,
    connectionStatus
  };
}
