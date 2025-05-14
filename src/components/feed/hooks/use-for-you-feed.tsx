
import { useState, useEffect } from "react";
import { nostrService } from "@/lib/nostr";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useFeedEvents } from "./use-feed-events";
import { toast } from "sonner";

interface UseForYouFeedProps {
  activeHashtag?: string;
}

export function useForYouFeed({ activeHashtag }: UseForYouFeedProps) {
  const [since, setSince] = useState<number | undefined>(undefined);
  const [until, setUntil] = useState(Math.floor(Date.now() / 1000));
  
  const { 
    events, 
    profiles, 
    repostData, 
    subId, 
    setSubId, 
    setupSubscription, 
    setEvents 
  } = useFeedEvents({
    since,
    until,
    activeHashtag
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
  
  const loadMoreEvents = () => {
    if (!subId) return;
    
    // Close previous subscription
    if (subId) {
      nostrService.unsubscribe(subId);
    }

    // Create new subscription with older timestamp range
    if (!since) {
      const oldestEvent = events.length > 0 ? 
        events.reduce((oldest, current) => oldest.created_at < current.created_at ? oldest : current) : 
        null;
      
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
  
  const {
    loadMoreRef,
    loading,
    setLoading,
    hasMore,
    setHasMore
  } = useInfiniteScroll(loadMoreEvents, { initialLoad: true });

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

      if (subId) {
        nostrService.unsubscribe(subId);
      }
      
      const newSubId = setupSubscription(currentTime - 24 * 60 * 60, currentTime);
      setSubId(newSubId);
      setLoading(false);
      
      toast("For You feed is personalized based on your interactions", {
        description: "Keep interacting with content you enjoy for a better experience",
      });
    };
    
    initFeed();
    
    return () => {
      if (subId) {
        nostrService.unsubscribe(subId);
      }
    };
  }, [activeHashtag]);

  useEffect(() => {
    if (events.length > 0 && loading) {
      setLoading(false);
    }
    
    if (events.length >= 100) {
      setHasMore(false);
    }
  }, [events, loading]);

  return {
    events,
    profiles,
    repostData,
    loadMoreRef,
    loading,
    hasMore,
    recordInteraction
  };
}
