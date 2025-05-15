
import { useState, useEffect, useCallback, useRef } from "react";
import { nostrService } from "@/lib/nostr";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useFeedEvents } from "./use-feed-events";
import { NostrEvent } from "@/lib/nostr/types";
import { toast } from "sonner";

interface UseForYouFeedProps {
  activeHashtag?: string;
}

export function useForYouFeed({ activeHashtag }: UseForYouFeedProps) {
  const [since, setSince] = useState<number | undefined>(undefined);
  const [until, setUntil] = useState(Math.floor(Date.now() / 1000));
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreTimeoutRef = useRef<number | null>(null);
  
  // Create our own state variables to manage feed lifecycle
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  
  const { 
    profiles, 
    repostData, 
    loadMoreRef,
    connectionStatus 
  } = useFeedEvents({
    since,
    until,
    activeHashtag,
    limit: 20 // Initial load of 20 posts
  });
  
  // Track user interactions for personalized feed
  const [interactionWeights, setInteractionWeights] = useState<Record<string, number>>({});
  
  // Load saved interaction weights from localStorage
  useEffect(() => {
    try {
      const savedWeights = localStorage.getItem('nostr_interaction_weights');
      if (savedWeights) {
        setInteractionWeights(JSON.parse(savedWeights));
      }
    } catch (error) {
      console.error('Failed to load interaction weights:', error);
    }
  }, []);
  
  // Save interaction weights to localStorage when they change
  useEffect(() => {
    if (Object.keys(interactionWeights).length > 0) {
      localStorage.setItem('nostr_interaction_weights', JSON.stringify(interactionWeights));
    }
  }, [interactionWeights]);
  
  // Sort events based on personalization algorithm
  useEffect(() => {
    if (events.length > 0 && Object.keys(interactionWeights).length > 0) {
      const sortedEvents = [...events].sort((a, b) => {
        const scoreA = calculatePostScore(a);
        const scoreB = calculatePostScore(b);
        return scoreB - scoreA;
      });
      
      setEvents(sortedEvents);
    }
  }, [events, interactionWeights]);
  
  // Setup subscription helper function
  const setupSubscription = useCallback((fromTimestamp?: number, toTimestamp?: number) => {
    // Build filters
    const filters = [];
    
    const baseFilter = {
      kinds: [1, 6], // Note and repost kinds
      limit: 20,
    };
    
    if (fromTimestamp) {
      baseFilter.since = fromTimestamp;
    }
    
    if (toTimestamp) {
      baseFilter.until = toTimestamp;
    }
    
    // Add hashtag filter if needed
    if (activeHashtag) {
      baseFilter["#t"] = [activeHashtag];
    }
    
    // Subscribe to events
    const subId = nostrService.subscribe(
      filters,
      (event) => {
        // Process the incoming event
        setEvents(prevEvents => {
          // Check if we already have this event
          if (prevEvents.some(e => e.id === event.id)) {
            return prevEvents;
          }
          
          // Add to events and sort (newest first)
          return [...prevEvents, event]
            .sort((a, b) => b.created_at - a.created_at);
        });
        
        // Update status
        setLoading(false);
      }
    );
    
    return subId;
  }, [activeHashtag]);
  
  // Calculate post score based on user interactions and content
  const calculatePostScore = (event: any) => {
    let score = 1; // Base score
    
    // Author weight: boost posts from authors the user interacts with
    if (event.pubkey && interactionWeights[event.pubkey]) {
      score += interactionWeights[event.pubkey] * 2;
    }
    
    // Content relevance: check for hashtags the user is interested in
    if (event.tags && Array.isArray(event.tags)) {
      event.tags.forEach((tag: string[]) => {
        if (tag[0] === 't' && interactionWeights[`tag:${tag[1]}`]) {
          score += interactionWeights[`tag:${tag[1]}`];
        }
      });
    }
    
    // Recency factor: newer posts get slightly higher scores
    const hoursSinceCreation = (Date.now() / 1000 - event.created_at) / 3600;
    if (hoursSinceCreation < 24) {
      score += (24 - hoursSinceCreation) / 24;
    }
    
    return score;
  };
  
  // Record user interaction with content
  const recordInteraction = (type: 'view' | 'like' | 'comment' | 'repost', event: any) => {
    // Weights for different types of interactions
    const weightMap = {
      view: 0.1,
      like: 0.5, 
      comment: 1.0,
      repost: 1.5
    };
    
    setInteractionWeights(prev => {
      const newWeights = { ...prev };
      
      // Track author interaction
      if (event.pubkey) {
        newWeights[event.pubkey] = (newWeights[event.pubkey] || 0) + weightMap[type];
      }
      
      // Track hashtag interaction
      if (event.tags && Array.isArray(event.tags)) {
        event.tags.forEach((tag: string[]) => {
          if (tag[0] === 't') {
            const tagKey = `tag:${tag[1]}`;
            newWeights[tagKey] = (newWeights[tagKey] || 0) + weightMap[type] * 0.5;
          }
        });
      }
      
      return newWeights;
    });
  };
  
  const loadMoreEvents = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    
    // Cancel any existing timeout
    if (loadMoreTimeoutRef.current) {
      clearTimeout(loadMoreTimeoutRef.current);
    }

    // Create new subscription with older timestamp range
    if (!since) {
      const oldestEvent = events.length > 0 ? 
        events.reduce((oldest, current) => oldest.created_at < current.created_at ? oldest : current) : 
        null;
      
      const newUntil = oldestEvent ? oldestEvent.created_at - 1 : until - 24 * 60 * 60;
      // Get older posts from the last 48 hours instead of 24 for more aggressive loading
      const newSince = newUntil - 48 * 60 * 60;
      
      setSince(newSince);
      setUntil(newUntil);
      
      setupSubscription(newSince, newUntil);
    } else {
      const newUntil = since;
      // Get older posts from the last 48 hours instead of 24 for more aggressive loading
      const newSince = newUntil - 48 * 60 * 60;
      
      setSince(newSince);
      setUntil(newUntil);
      
      setupSubscription(newSince, newUntil);
    }
    
    // Set loading more to false after a shorter delay
    loadMoreTimeoutRef.current = window.setTimeout(() => {
      setLoadingMore(false);
      loadMoreTimeoutRef.current = null;
    }, 1500); // Reduced from 2000ms to 1500ms
  }, [events, since, until, setupSubscription, loadingMore]);
  
  const {
    loadingMore: scrollLoadingMore
  } = useInfiniteScroll(loadMoreEvents, { 
    initialLoad: true,
    threshold: 800, 
    aggressiveness: 'high',
    preservePosition: true
  });

  useEffect(() => {
    const initFeed = async () => {
      await nostrService.connectToUserRelays();
      
      // Reset state when filter changes
      setEvents([]);
      setHasMore(true);
      setLoading(true);

      // Reset the timestamp range for new subscription
      const currentTime = Math.floor(Date.now() / 1000);
      setSince(undefined);
      setUntil(currentTime);
      
      setupSubscription(currentTime - 24 * 60 * 60, currentTime);
      setLoading(false);
    };
    
    initFeed();
    
    // Cleanup timeout when component unmounts
    return () => {
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
    };
  }, [activeHashtag, setupSubscription]);

  useEffect(() => {
    if (events.length > 0 && loading) {
      setLoading(false);
    }
  }, [events, loading]);

  return {
    events,
    profiles,
    repostData,
    loadMoreRef,
    loading,
    hasMore,
    loadMoreEvents,
    recordInteraction,
    loadingMore: loadingMore || scrollLoadingMore
  };
}
