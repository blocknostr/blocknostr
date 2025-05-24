
import { useState, useEffect } from 'react';
import { NostrEvent, nostrService } from '@/lib/nostr';

interface UseProfileFeedProps {
  npub: string;
  since?: number;
  until?: number;
  kind?: number;
  limit?: number;
}

export function useProfileFeed({ npub, since, until, kind = 1, limit = 20 }: UseProfileFeedProps) {
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [repostData, setRepostData] = useState<Record<string, any>>({});
  const [subId, setSubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to set up subscription
  const setupSubscription = (since?: number, until?: number) => {
    try {
      // Get hex pubkey from npub
      const pubkey = nostrService.getHexFromNpub(npub);
      
      // Create filter
      const filter = {
        authors: [pubkey],
        kinds: [kind],
        limit: limit,
      };
      
      // Add time range if provided
      if (since) {
        Object.assign(filter, { since });
      }
      if (until) {
        Object.assign(filter, { until });
      }
      
      // Subscribe to events
      const id = nostrService.subscribe([filter], (event) => {
        setEvents(prev => {
          if (prev.some(e => e.id === event.id)) {
            return prev;
          }
          return [...prev, event].sort((a, b) => b.created_at - a.created_at);
        });
        
        // Fetch profile for event author if not already fetched
        if (!profiles[event.pubkey]) {
          nostrService.getUserProfile(event.pubkey).then(profile => {
            if (profile) {
              setProfiles(prev => ({ ...prev, [event.pubkey]: profile }));
            }
          });
        }
      });
      
      return id;
    } catch (e) {
      console.error("Error setting up subscription:", e);
      setError("Failed to set up subscription");
      return null;
    }
  };
  
  useEffect(() => {
    setLoading(true);
    // Set up initial subscription
    const id = setupSubscription(since, until);
    setSubId(id);
    
    // Cleanup function
    return () => {
      if (id) {
        nostrService.unsubscribe(id);
      }
    };
  }, [npub, kind]);
  
  // Set loading to false after initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  return { 
    events, 
    profiles, 
    repostData, 
    subId, 
    setSubId, 
    setupSubscription, 
    loading, 
    error, 
    setEvents
  };
}
