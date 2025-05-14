
// Update the useFollowingFeed hook to use preserved state
import { useState, useEffect, useRef, useCallback } from 'react';
import { useProfileFetcher } from './hooks/use-profile-fetcher';
import { nostrService, NostrEvent } from '@/lib/nostr';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';

interface UseFollowingFeedProps {
  activeHashtag?: string;
  initialEvents?: NostrEvent[];
  initialProfiles?: Record<string, any>;
  initialRepostData?: Record<string, { pubkey: string, original: NostrEvent }>;
  initialHasMore?: boolean;
}

export function useFollowingFeed({
  activeHashtag,
  initialEvents = [],
  initialProfiles = {},
  initialRepostData = {},
  initialHasMore = true
}: UseFollowingFeedProps) {
  const [events, setEvents] = useState<NostrEvent[]>(initialEvents);
  const [profiles, setProfiles] = useState<Record<string, any>>(initialProfiles);
  const [repostData, setRepostData] = useState<Record<string, { pubkey: string, original: NostrEvent }>>(initialRepostData);
  const [following, setFollowing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [cacheHit, setCacheHit] = useState(false);
  const [loadingFromCache, setLoadingFromCache] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  
  // If we're provided with initial state, use it
  const initialState = initialEvents.length > 0;
  
  const loadMoreTimeoutRef = useRef<number | null>(null);
  
  // Get the list of users the current user is following
  useEffect(() => {
    const fetchFollowing = async () => {
      const followingList = await nostrService.following;
      if (followingList && followingList.length > 0) {
        setFollowing(followingList);
      } else {
        setFollowing([]);
        setHasMore(false);
        setLoading(false);
      }
    };
    
    if (!initialState) {
      fetchFollowing();
    }
  }, [initialState]);
  
  // Function to refresh feed data
  const refreshFeed = useCallback(() => {
    // Only refresh if we're logged in and have following
    if (!nostrService.publicKey || following.length === 0) return;
    
    setLoading(true);
    setEvents([]);
    
    // Cancel existing subscription
    if (subscriptionId) {
      nostrService.unsubscribe(subscriptionId);
    }
    
    // Setup new subscription with current time window
    const currentTime = Math.floor(Date.now() / 1000);
    const since = currentTime - 24 * 60 * 60; // Last 24 hours
    
    const filter: any = {
      kinds: [1], // Regular notes (kind 1)
      authors: following,
      limit: 50,
      since,
      until: currentTime
    };
    
    // Add hashtag filter if present
    if (activeHashtag) {
      filter['#t'] = [activeHashtag];
    }
    
    const subId = Math.random().toString(36).substring(2, 15);
    
    nostrService.subscribe({
      filter,
      eventHandler: handleEvent,
      id: subId
    });
    
    setSubscriptionId(subId);
    setCacheHit(false);
    setLastUpdated(null);
  }, [following, subscriptionId, activeHashtag]);
  
  // Handle incoming events
  const handleEvent = useCallback((event: NostrEvent) => {
    if (!event) return;
    
    // Skip duplicates
    setEvents(prevEvents => {
      if (prevEvents.some(e => e.id === event.id)) return prevEvents;
      return [event, ...prevEvents];
    });
    
    // Fetch profile data if we don't have it already
    if (event.pubkey && !profiles[event.pubkey]) {
      nostrService.getUserProfile(event.pubkey).then(profileData => {
        if (profileData) {
          setProfiles(prev => ({
            ...prev,
            [event.pubkey]: profileData
          }));
        }
      });
    }
    
    // Handle reposts
    if (event.kind === 1 && event.tags && event.tags.some(tag => tag[0] === 'e')) {
      const eTags = event.tags.filter(tag => tag[0] === 'e');
      if (eTags.length > 0 && (!event.content || event.content.trim() === '')) {
        // This is a repost, find the original event
        const originalEventId = eTags[0][1];
        
        // Try to find the original event
        nostrService.getEventById(originalEventId).then(originalEvent => {
          if (originalEvent) {
            setRepostData(prev => ({
              ...prev,
              [originalEvent.id]: { pubkey: event.pubkey, original: originalEvent }
            }));
            
            // Also fetch profile data for the original author
            if (originalEvent.pubkey && !profiles[originalEvent.pubkey]) {
              nostrService.getUserProfile(originalEvent.pubkey).then(profileData => {
                if (profileData) {
                  setProfiles(prev => ({
                    ...prev,
                    [originalEvent.pubkey]: profileData
                  }));
                }
              });
            }
          }
        });
      }
    }
  }, [profiles]);
  
  // Setup subscription when following list is loaded
  useEffect(() => {
    // If we have cached events, use those instead of setting up a subscription
    if (initialState) {
      setLoading(false);
      setHasMore(initialHasMore);
      return;
    }
    
    const setupSubscription = async () => {
      // Only proceed if we have a list of followed users
      if (following.length === 0) return;
      
      // Connect to relays
      await nostrService.connectToUserRelays();
      
      const currentTime = Math.floor(Date.now() / 1000);
      const since = currentTime - 24 * 60 * 60; // Last 24 hours
      
      const filter: any = {
        kinds: [1], // Regular notes (kind 1)
        authors: following,
        limit: 50,
        since,
        until: currentTime
      };
      
      // Add hashtag filter if present
      if (activeHashtag) {
        filter['#t'] = [activeHashtag];
      }
      
      const subId = Math.random().toString(36).substring(2, 15);
      
      nostrService.subscribe({
        filter,
        eventHandler: handleEvent,
        id: subId
      });
      
      setSubscriptionId(subId);
      
      // Turn off loading after some time even if no events received
      setTimeout(() => {
        setLoading(false);
        
        // If we still don't have events, retry with a longer timeframe
        if (events.length === 0 && !isRetrying) {
          retryWithLongerTimeframe();
        }
      }, 6000);
    };
    
    setupSubscription();
    
    // Cleanup subscription on unmount
    return () => {
      if (subscriptionId) {
        nostrService.unsubscribe(subscriptionId);
      }
    };
  }, [following, activeHashtag, handleEvent, initialState]);
  
  // Retry loading with a longer timeframe if no events found
  const retryWithLongerTimeframe = useCallback(() => {
    if (retryAttempt >= 3 || events.length > 0) return;
    
    setIsRetrying(true);
    const nextRetryAttempt = retryAttempt + 1;
    setRetryAttempt(nextRetryAttempt);
    
    // Cancel the current subscription
    if (subscriptionId) {
      nostrService.unsubscribe(subscriptionId);
    }
    
    // Try with a longer time window based on retry attempt
    const currentTime = Math.floor(Date.now() / 1000);
    const timeWindowDays = [3, 7, 14][nextRetryAttempt - 1] || 30; // 3, 7, 14, or 30 days
    const since = currentTime - (timeWindowDays * 24 * 60 * 60);
    
    console.log(`Retry attempt ${nextRetryAttempt}: Looking back ${timeWindowDays} days for following feed`);
    
    const filter: any = {
      kinds: [1],
      authors: following,
      limit: 50,
      since,
      until: currentTime
    };
    
    if (activeHashtag) {
      filter['#t'] = [activeHashtag];
    }
    
    const subId = Math.random().toString(36).substring(2, 15);
    
    nostrService.subscribe({
      filter,
      eventHandler: handleEvent,
      id: subId
    });
    
    setSubscriptionId(subId);
    
    // Set a timeout for this retry attempt
    setTimeout(() => {
      setIsRetrying(false);
      
      // If still no events, try the next retry
      if (events.length === 0) {
        retryWithLongerTimeframe();
      }
    }, 5000);
  }, [subscriptionId, events.length, retryAttempt, following, activeHashtag, handleEvent]);
  
  // Load more posts when user scrolls to bottom
  const loadMoreEvents = useCallback(() => {
    // Don't load more if already loading or no more to load
    if (loadingMore || !hasMore || following.length === 0) return;
    
    setLoadingMore(true);
    
    // Get the oldest event we have
    const oldestEvent = events.length > 0 
      ? events.reduce((oldest, current) => oldest.created_at < current.created_at ? oldest : current)
      : null;
    
    if (!oldestEvent) {
      setLoadingMore(false);
      return;
    }
    
    // Cancel current subscription
    if (subscriptionId) {
      nostrService.unsubscribe(subscriptionId);
    }
    
    // Create new subscription with older timestamp range
    const until = oldestEvent.created_at - 1;
    const since = until - 24 * 60 * 60 * 3; // 3 days before the oldest post
    
    const filter: any = {
      kinds: [1],
      authors: following,
      limit: 20,
      since,
      until
    };
    
    if (activeHashtag) {
      filter['#t'] = [activeHashtag];
    }
    
    const subId = Math.random().toString(36).substring(2, 15);
    
    nostrService.subscribe({
      filter,
      eventHandler: handleEvent,
      id: subId
    });
    
    setSubscriptionId(subId);
    
    // Set loading more to false after a delay
    if (loadMoreTimeoutRef.current) {
      clearTimeout(loadMoreTimeoutRef.current);
    }
    
    loadMoreTimeoutRef.current = window.setTimeout(() => {
      setLoadingMore(false);
      loadMoreTimeoutRef.current = null;
      
      // If we didn't get any new events, we're probably at the end
      const newEventsCount = events.length;
      setTimeout(() => {
        if (events.length === newEventsCount) {
          setHasMore(false);
        }
      }, 2000);
    }, 3000);
  }, [loadingMore, hasMore, events, following, subscriptionId, activeHashtag, handleEvent]);

  const {
    loadMoreRef,
    loading: scrollLoading,
    hasMore: scrollHasMore
  } = useInfiniteScroll(loadMoreEvents, { 
    initialLoad: false,
    threshold: 800,
    preservePosition: true
  });

  return {
    events,
    profiles,
    repostData,
    loadMoreRef,
    loading,
    following,
    refreshFeed,
    lastUpdated,
    cacheHit,
    loadingFromCache,
    loadingMore,
    hasMore,
    loadMoreEvents,
    isRetrying,
    setEvents,
    setProfiles,
    setRepostData
  };
}
