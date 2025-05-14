
import { useState, useEffect, useRef, useCallback } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useFeedEvents } from "./use-feed-events";

interface UseForYouFeedProps {
  activeHashtag?: string;
}

export function useForYouFeed({ activeHashtag }: UseForYouFeedProps) {
  const [since, setSince] = useState<number | undefined>(undefined);
  const [until, setUntil] = useState(Math.floor(Date.now() / 1000));
  const [loadingMore, setLoadingMore] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isInitialLoadingTimeout, setIsInitialLoadingTimeout] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const loadMoreTimeoutRef = useRef<number | null>(null);
  const minimumLoadingTimeRef = useRef<number | null>(null);
  
  // Get user interaction history from local storage
  const interactionHistory = useRef<Record<string, { type: string, count: number, timestamp: number }>>({});
  
  // Load interaction history from localStorage
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('forYouInteractions');
      if (storedHistory) {
        interactionHistory.current = JSON.parse(storedHistory);
      }
    } catch (error) {
      console.error('Failed to load interaction history:', error);
    }
  }, []);
  
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
    activeHashtag,
    limit: 30,
    feedType: 'for-you'
  });
  
  // Record user interactions with posts
  const recordInteraction = (type: 'view' | 'like' | 'reply' | 'repost', event: NostrEvent) => {
    if (!event.id || !event.pubkey) return;
    
    // Get current timestamp
    const now = Date.now();
    
    // Record interaction with author
    const authorKey = `author:${event.pubkey}`;
    if (!interactionHistory.current[authorKey]) {
      interactionHistory.current[authorKey] = { type: 'author', count: 0, timestamp: now };
    }
    interactionHistory.current[authorKey].count += type === 'view' ? 0.5 : 1;
    interactionHistory.current[authorKey].timestamp = now;
    
    // Record interaction with post
    const postKey = `post:${event.id}`;
    interactionHistory.current[postKey] = { type, count: 1, timestamp: now };
    
    // Extract and record hashtags
    const content = event.content || '';
    const hashtagRegex = /#(\w+)/g;
    let match;
    while ((match = hashtagRegex.exec(content)) !== null) {
      const tag = match[1].toLowerCase();
      const tagKey = `tag:${tag}`;
      if (!interactionHistory.current[tagKey]) {
        interactionHistory.current[tagKey] = { type: 'tag', count: 0, timestamp: now };
      }
      interactionHistory.current[tagKey].count += type === 'view' ? 0.2 : 0.5;
      interactionHistory.current[tagKey].timestamp = now;
    }
    
    // Save to localStorage
    try {
      localStorage.setItem('forYouInteractions', JSON.stringify(interactionHistory.current));
    } catch (error) {
      console.error('Failed to save interaction history:', error);
    }
  };
  
  // Function to handle retrying when no posts are loaded
  const retryLoadingPosts = useCallback(async () => {
    if (events.length === 0 && !isRetrying && retryCount < 2) {
      setIsRetrying(true);
      
      // Close previous subscription
      if (subId) {
        nostrService.unsubscribe(subId);
      }
      
      // Create new subscription with slightly extended time range
      const currentTime = Math.floor(Date.now() / 1000);
      const threeWeeksAgo = currentTime - 24 * 60 * 60 * 21; // 3 weeks for retry
      
      setSince(threeWeeksAgo);
      setUntil(currentTime);
      
      // Start the new subscription with the extended timestamp range
      const newSubId = setupSubscription(threeWeeksAgo, currentTime);
      setSubId(newSubId);
      
      setRetryCount(prevCount => prevCount + 1);
      
      // End retry state after a delay
      setTimeout(() => setIsRetrying(false), 3000);
    }
  }, [events, isRetrying, retryCount, subId, setupSubscription]);
  
  const loadMoreEvents = useCallback(async () => {
    if (!subId || loadingMore) return;
    setLoadingMore(true);
    
    // Cancel any existing timeout
    if (loadMoreTimeoutRef.current) {
      clearTimeout(loadMoreTimeoutRef.current);
    }
    
    // Close previous subscription
    if (subId) {
      nostrService.unsubscribe(subId);
    }

    // Create new subscription with older timestamp range
    if (!since) {
      // If no since value yet, get the oldest post timestamp
      const oldestEvent = events.length > 0 ? 
        events.reduce((oldest, current) => oldest.created_at < current.created_at ? oldest : current) : 
        null;
      
      const newUntil = oldestEvent ? oldestEvent.created_at - 1 : until - 24 * 60 * 60;
      const newSince = newUntil - 48 * 60 * 60; // Get events from the last 48 hours
      
      setSince(newSince);
      setUntil(newUntil);
      
      // Start the new subscription with the older timestamp range
      const newSubId = setupSubscription(newSince, newUntil);
      setSubId(newSubId);
    } else {
      // We already have a since value, so use it to get older posts
      const newUntil = since;
      const newSince = newUntil - 48 * 60 * 60; // Get events from the last 48 hours
      
      setSince(newSince);
      setUntil(newUntil);
      
      // Start the new subscription with the older timestamp range
      const newSubId = setupSubscription(newSince, newUntil);
      setSubId(newSubId);
    }
    
    // Set loading more to false after a delay
    loadMoreTimeoutRef.current = window.setTimeout(() => {
      setLoadingMore(false);
      loadMoreTimeoutRef.current = null;
    }, 1500);
  }, [subId, events, since, until, setupSubscription, loadingMore]);
  
  const {
    loadMoreRef,
    loading,
    setLoading,
    hasMore,
    setHasMore,
    loadingMore: scrollLoadingMore
  } = useInfiniteScroll(loadMoreEvents, { initialLoad: true });
  
  useEffect(() => {
    const initFeed = async () => {
      // Set initial loading timeout
      setIsInitialLoadingTimeout(true);
      
      // Set a minimum loading time (6 seconds) before showing empty state
      minimumLoadingTimeRef.current = window.setTimeout(() => {
        setIsInitialLoadingTimeout(false);
        minimumLoadingTimeRef.current = null;
      }, 6000);
      
      // Reset state when filter changes
      setEvents([]);
      setHasMore(true);
      setLoading(true);
      setRetryCount(0);
      
      // Reset the timestamp range for new subscription
      const currentTime = Math.floor(Date.now() / 1000);
      setSince(undefined);
      setUntil(currentTime);
      
      // Close previous subscription if exists
      if (subId) {
        nostrService.unsubscribe(subId);
      }
      
      // Get the last 36 hours of posts for initial "for you" feed
      // This gives us a larger initial dataset to filter from
      const newSince = currentTime - 36 * 60 * 60;
      const newSubId = setupSubscription(newSince, currentTime);
      setSubId(newSubId);
    };
    
    initFeed();
    
    // Cleanup subscription and timeout when component unmounts
    return () => {
      if (subId) {
        nostrService.unsubscribe(subId);
      }
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
      if (minimumLoadingTimeRef.current) {
        clearTimeout(minimumLoadingTimeRef.current);
      }
    };
  }, [activeHashtag]);
  
  // Add the retry logic if no events after certain time
  useEffect(() => {
    // If we've been loading for some time but still have no events, retry with a longer timeframe
    if (!loading && events.length === 0 && !isRetrying && retryCount < 2) {
      const retryTimeout = window.setTimeout(() => {
        retryLoadingPosts();
      }, 5000); // Wait 5 seconds before retrying
      
      return () => clearTimeout(retryTimeout);
    }
  }, [loading, events.length, isRetrying, retryCount, retryLoadingPosts]);

  // Mark the loading as finished when we get events
  useEffect(() => {
    if (events.length > 0 && loading) {
      setLoading(false);
    }
  }, [events, loading, setLoading]);

  return {
    events,
    profiles,
    repostData,
    loadMoreRef,
    loading: loading || isRetrying,
    hasMore,
    loadMoreEvents,
    loadingMore: loadingMore || scrollLoadingMore,
    recordInteraction,
    isInitialLoadingTimeout
  };
}
