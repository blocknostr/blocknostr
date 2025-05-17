
import { useState, useEffect, useCallback, useRef } from "react";
import { NostrEvent } from "@/lib/nostr";
import { useProfileFetcher } from "@/components/feed/hooks/use-profile-fetcher";
import { useProfileReplies } from "@/hooks/profile/useProfileReplies";
import { useProfileReposts } from "@/hooks/profile/useProfileReposts";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";

// Define extended types for the different event types
interface ExtendedNostrEvent extends NostrEvent {
  postType?: 'post' | 'reply' | 'repost';
  repost?: boolean;
  repostData?: {
    created_at?: number;
    pubkey?: string;
    id?: string;
  };
}

interface UseProfileTabsDataProps {
  events: NostrEvent[];
  media: NostrEvent[];
  reposts: { originalEvent: NostrEvent; repostEvent: NostrEvent }[];
  profileData: any;
  originalPostProfiles: Record<string, any>;
  replies?: NostrEvent[];
  reactions?: NostrEvent[];
  referencedEvents?: Record<string, any>;
  hexPubkey?: string;
}

export function useProfileTabsData({
  events = [],
  media = [],
  reposts = [],
  profileData,
  originalPostProfiles = {},
  replies = [],
  referencedEvents = {},
  hexPubkey = ""
}: UseProfileTabsDataProps) {
  // Limit state updates by using refs for large data structures
  const eventsRef = useRef(events);
  const mediaRef = useRef(media);
  const repostsRef = useRef(reposts);
  const repliesRef = useRef(replies || []);
  
  // Update refs when props change but limit re-renders
  useEffect(() => {
    eventsRef.current = events;
    mediaRef.current = media;
    repostsRef.current = reposts;
    repliesRef.current = replies || [];
  }, [events, media, reposts, replies]);
  
  const { fetchProfileData } = useProfileFetcher();
  const [activeTab, setActiveTab] = useState("feed");
  const [localOriginalPostProfiles, setLocalOriginalPostProfiles] = useState(originalPostProfiles);
  const [postsLimit, setPostsLimit] = useState(10);
  
  // State for the unified feed items
  const [unifiedFeedItems, setUnifiedFeedItems] = useState<ExtendedNostrEvent[]>([]);
  const [displayedMedia, setDisplayedMedia] = useState<NostrEvent[]>([]);
  
  // Fetch replies using the hook - with lazy loading
  const { 
    replies: tabReplies, 
    loading: repliesLoading,
    loadingMore: repliesLoadingMore,
    hasMore: repliesHasMore,
    loadMore: loadMoreReplies 
  } = useProfileReplies({ 
    hexPubkey, 
    enabled: activeTab === "feed", // Only fetch when tab is active
    initialLimit: 10
  });
  
  // Fetch reposts using the hook - with lazy loading
  const {
    reposts: tabReposts,
    loading: repostsLoading,
    loadingMore: repostsLoadingMore,
    hasMore: repostsHasMore,
    loadMore: loadMoreReposts
  } = useProfileReposts({
    hexPubkey,
    originalPostProfiles: localOriginalPostProfiles,
    setOriginalPostProfiles: setLocalOriginalPostProfiles,
    enabled: activeTab === "feed", // Only fetch when tab is active
    initialLimit: 10
  });
  
  // Handle tab change
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    setPostsLimit(10); // Reset pagination when changing tabs
  }, []);
  
  // Function to merge and sort all feed items - memoized to prevent recreation
  const mergeFeedItems = useCallback(() => {
    // Use refs to avoid dependency on large arrays
    const currentEvents = eventsRef.current;
    const currentReplies = tabReplies.length > 0 ? tabReplies : repliesRef.current;
    
    // Prepare reposts array - extract original events from reposts
    const repostEvents = tabReposts.length > 0 
      ? tabReposts.map(repost => ({
          ...repost.originalEvent,
          repost: true,
          repostData: {
            created_at: repost.repostEvent.created_at,
            pubkey: repost.repostEvent.pubkey,
            id: repost.repostEvent.id
          }
        }))
      : repostsRef.current.map(repost => ({
          ...repost.originalEvent,
          repost: true,
          repostData: {
            pubkey: repost.repostEvent?.pubkey,
            id: repost.repostEvent?.id
          }
        }));

    // Combine all events with limited initial batches
    const allEvents = [
      ...currentEvents.map(event => ({ ...event, postType: 'post' })),
      ...currentReplies.map(event => ({ ...event, postType: 'reply' })),
      ...repostEvents.map(event => ({ ...event, postType: 'repost' }))
    ] as ExtendedNostrEvent[];
    
    // Sort by created_at (newest first)
    const sortedEvents = allEvents.sort((a, b) => {
      // Use repostData.created_at if available (for accurate repost time)
      const timeA = a.repostData?.created_at || a.created_at;
      const timeB = b.repostData?.created_at || b.created_at;
      return timeB - timeA;
    });
    
    // Remove duplicates based on event.id using a Map for better performance
    const uniqueEventsMap = new Map();
    sortedEvents.forEach(event => {
      if (!uniqueEventsMap.has(event.id)) {
        uniqueEventsMap.set(event.id, event);
      }
    });
    
    return Array.from(uniqueEventsMap.values());
  }, [tabReplies, tabReposts]); // dependencies reduced to only what changes frequently
  
  // Load more handler for unified feed - memoized to prevent recreation
  const loadMoreUnifiedFeed = useCallback(() => {
    setPostsLimit(prev => prev + 10);
    
    // Load more replies and reposts only if needed
    if (eventsRef.current.length <= postsLimit && !repliesLoadingMore) {
      loadMoreReplies();
    }
    
    if (!repliesHasMore && !repostsLoadingMore) {
      loadMoreReposts();
    }
  }, [loadMoreReplies, loadMoreReposts, postsLimit, repliesHasMore, repliesLoadingMore, repostsLoadingMore]);
  
  // Define loadingMore state for unified feed
  const [unifiedFeedLoadingMore, setUnifiedFeedLoadingMore] = useState(false);
  
  // Set up infinite scroll for unified feed
  const {
    loadMoreRef: unifiedFeedLoadMoreRef,
    loading: unifiedFeedLoading,
    hasMore: unifiedFeedHasMore,
    setHasMore: setUnifiedFeedHasMore
  } = useInfiniteScroll(loadMoreUnifiedFeed, { 
    disabled: activeTab !== "feed" || 
      (eventsRef.current.length === 0 && !repliesHasMore && !repostsHasMore)
  });
  
  // Load more handler for media tab - memoized to prevent recreation
  const loadMoreMedia = useCallback(() => {
    setPostsLimit(prev => prev + 10);
  }, []);
  
  // Set up infinite scroll for media tab
  const {
    loadMoreRef: mediaLoadMoreRef,
    hasMore: mediaHasMore,
    setHasMore: setMediaHasMore
  } = useInfiniteScroll(loadMoreMedia, { 
    disabled: activeTab !== "media" || mediaRef.current.length <= postsLimit
  });
  
  // Update unified feed items when data changes - with debounced updates
  useEffect(() => {
    const updateTimer = setTimeout(() => {
      if (activeTab === "feed") {
        const mergedItems = mergeFeedItems();
        setUnifiedFeedItems(mergedItems.slice(0, postsLimit));
        
        // Update hasMore state for unified feed
        setUnifiedFeedHasMore(
          mergedItems.length > postsLimit || 
          repliesHasMore || 
          repostsHasMore
        );
        
        // Update loadingMore state based on replies and reposts loading states
        setUnifiedFeedLoadingMore(repliesLoadingMore || repostsLoadingMore);
      }
    }, 50); // Add small debounce to batch updates
    
    return () => clearTimeout(updateTimer);
  }, [
    activeTab, postsLimit, mergeFeedItems, 
    repliesHasMore, repostsHasMore, 
    repliesLoadingMore, repostsLoadingMore
  ]);
  
  // Update displayed media based on limit - with debounced updates
  useEffect(() => {
    const updateTimer = setTimeout(() => {
      if (activeTab === "media") {
        const slicedMedia = mediaRef.current.slice(0, postsLimit);
        setDisplayedMedia(slicedMedia);
        
        // Update hasMore state
        setMediaHasMore(slicedMedia.length < mediaRef.current.length);
      }
    }, 50); // Add small debounce
    
    return () => clearTimeout(updateTimer);
  }, [activeTab, postsLimit]);
  
  // Combined loading state for unified feed
  const isUnifiedFeedLoading = 
    (eventsRef.current.length === 0 && 
     tabReplies.length === 0 && 
     tabReposts.length === 0) && 
    (repliesLoading || repostsLoading);

  return {
    activeTab,
    handleTabChange,
    unifiedFeedItems,
    displayedMedia,
    unifiedFeedLoading: isUnifiedFeedLoading,
    unifiedFeedLoadingMore,
    unifiedFeedHasMore,
    mediaHasMore,
    unifiedFeedLoadMoreRef,
    mediaLoadMoreRef,
    localOriginalPostProfiles
  };
}
