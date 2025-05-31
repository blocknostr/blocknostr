import { useCallback, useMemo, useState, useEffect } from 'react';
import { NostrEvent } from '@/lib/nostr/types';
import { useUserPreferences } from '@/hooks/business/useUserPreferences';
import { useAuth } from '@/hooks/useAuth';
import { useGetFeedQuery, useGetFeedMoreQuery } from '@/api/rtk/nostrApi';

export type FeedType = 'global' | 'following';

interface UseFeedRTKProps {
  feedType: FeedType;
  activeHashtag?: string;
  onLoadingChange?: (isLoading: boolean) => void;
}

interface UseFeedRTKReturn {
  events: NostrEvent[];
  profiles: Record<string, any>;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMoreEvents: () => void;
  refreshEvents: () => void;
}

/**
 * Simplified RTK Query-based feed hook
 * Replaces the complex feedSlice-based useFeed hook
 */
export function useFeedRTK({ feedType, activeHashtag, onLoadingChange }: UseFeedRTKProps): UseFeedRTKReturn {
  const { preferences } = useUserPreferences();
  const { isLoggedIn } = useAuth();
  const [moreEventsData, setMoreEventsData] = useState<NostrEvent[]>([]);
  const [allProfiles, setAllProfiles] = useState<Record<string, any>>({});

  // Determine hashtags for global feed
  const hashtags = useMemo(() => {
    if (feedType !== 'global') return undefined;
    
    if (activeHashtag) return [activeHashtag];
    
    const userTags = preferences.feedFilters?.globalFeedTags;
    if (userTags && userTags.length > 0) return userTags;
    
    return ['bitcoin', 'alephium', 'ergo']; // Default hashtags
  }, [feedType, activeHashtag, preferences.feedFilters?.globalFeedTags]);

  // Main feed query
  const {
    data: feedData,
    isLoading,
    error: feedError,
    refetch
  } = useGetFeedQuery({
    type: feedType,
    hashtags,
    hashtag: activeHashtag,
    limit: 20,
    forceRefresh: true
  }, {
    skip: feedType === 'following' && !isLoggedIn, // Skip following feed if not logged in
  });

  // Track oldest timestamp for pagination
  const oldestTimestamp = useMemo(() => {
    const allEvents = [...(feedData?.events || []), ...moreEventsData];
    if (allEvents.length === 0) return undefined;
    return Math.min(...allEvents.map(e => e.created_at));
  }, [feedData?.events, moreEventsData]);

  // More events query (triggered manually)
  const [shouldLoadMore, setShouldLoadMore] = useState(false);
  const {
    data: moreData,
    isLoading: isLoadingMore,
    error: moreError
  } = useGetFeedMoreQuery({
    type: feedType,
    hashtags,
    hashtag: activeHashtag,
    until: oldestTimestamp || 0,
    limit: 15
  }, {
    skip: !shouldLoadMore || !oldestTimestamp || (feedType === 'following' && !isLoggedIn),
  });

  // Handle more data when it arrives
  useEffect(() => {
    if (moreData && shouldLoadMore) {
      setMoreEventsData(prev => {
        // Filter out duplicates
        const existingIds = new Set([...(feedData?.events || []).map(e => e.id), ...prev.map(e => e.id)]);
        const newEvents = moreData.events.filter(e => !existingIds.has(e.id));
        return [...prev, ...newEvents];
      });
      
      setAllProfiles(prev => ({
        ...prev,
        ...moreData.profiles
      }));
      
      setShouldLoadMore(false);
    }
  }, [moreData, shouldLoadMore, feedData?.events]);

  // Combine initial profiles with more profiles
  useEffect(() => {
    if (feedData?.profiles) {
      setAllProfiles(prev => ({
        ...feedData.profiles,
        ...prev
      }));
    }
  }, [feedData?.profiles]);

  // Combined events
  const events = useMemo(() => {
    const initialEvents = feedData?.events || [];
    return [...initialEvents, ...moreEventsData];
  }, [feedData?.events, moreEventsData]);

  // Load more events callback
  const loadMoreEvents = useCallback(() => {
    if (!isLoadingMore && (feedData?.hasMore || moreData?.hasMore) && oldestTimestamp) {
      setShouldLoadMore(true);
    }
  }, [isLoadingMore, feedData?.hasMore, moreData?.hasMore, oldestTimestamp]);

  // Refresh events callback
  const refreshEvents = useCallback(() => {
    setMoreEventsData([]);
    setAllProfiles({});
    refetch();
  }, [refetch]);

  // Determine if there are more events to load
  const hasMore = feedData?.hasMore || moreData?.hasMore || false;

  // Combine errors
  const error = feedError || moreError ? 
    String(feedError || moreError || 'Unknown error') : null;

  // Notify parent of loading state changes
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);

  return {
    events,
    profiles: allProfiles,
    loading: isLoading,
    loadingMore: isLoadingMore,
    hasMore,
    error,
    loadMoreEvents,
    refreshEvents
  };
} 
