
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
  const { fetchProfileData } = useProfileFetcher();
  const [activeTab, setActiveTab] = useState("feed");
  const [localOriginalPostProfiles, setLocalOriginalPostProfiles] = useState(originalPostProfiles);
  const [postsLimit, setPostsLimit] = useState(10);
  
  // State for the unified feed items
  const [unifiedFeedItems, setUnifiedFeedItems] = useState<ExtendedNostrEvent[]>([]);
  const [displayedMedia, setDisplayedMedia] = useState<NostrEvent[]>([]);
  
  // Fetch replies using the hook
  const { 
    replies: tabReplies, 
    loading: repliesLoading,
    loadingMore: repliesLoadingMore,
    hasMore: repliesHasMore,
    loadMore: loadMoreReplies 
  } = useProfileReplies({ 
    hexPubkey, 
    enabled: true, // Always fetch replies regardless of tab
    initialLimit: 10
  });
  
  // Fetch reposts using the hook
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
    enabled: true, // Always fetch reposts regardless of tab
    initialLimit: 10
  });
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPostsLimit(10); // Reset pagination when changing tabs
  };
  
  // Function to merge and sort all feed items
  const mergeFeedItems = useCallback(() => {
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
      : reposts.map(repost => ({
          ...repost.originalEvent,
          repost: true,
          repostData: {
            pubkey: repost.repostEvent?.pubkey,
            id: repost.repostEvent?.id
          }
        }));

    // Get reply events
    const replyEvents = tabReplies.length > 0 ? tabReplies : replies || [];
    
    // Combine all events
    const allEvents = [
      ...events.map(event => ({ ...event, postType: 'post' })),
      ...replyEvents.map(event => ({ ...event, postType: 'reply' })),
      ...repostEvents.map(event => ({ ...event, postType: 'repost' }))
    ] as ExtendedNostrEvent[];
    
    // Sort by created_at (newest first)
    const sortedEvents = allEvents.sort((a, b) => {
      // Use repostData.created_at if available (for accurate repost time)
      const timeA = a.repostData?.created_at || a.created_at;
      const timeB = b.repostData?.created_at || b.created_at;
      return timeB - timeA;
    });
    
    // Remove duplicates based on event.id
    const uniqueEvents = sortedEvents.filter((event, index, self) =>
      index === self.findIndex((e) => e.id === event.id)
    );
    
    return uniqueEvents;
  }, [events, tabReplies, tabReposts, reposts, replies]);
  
  // Load more handler for unified feed
  const loadMoreUnifiedFeed = useCallback(() => {
    setPostsLimit(prev => prev + 10);
    
    // If we've loaded all posts, load more replies
    if (events.length <= postsLimit) {
      loadMoreReplies();
    }
    
    // If we've loaded all replies, load more reposts
    if (!repliesHasMore) {
      loadMoreReposts();
    }
  }, [events.length, loadMoreReplies, loadMoreReposts, postsLimit, repliesHasMore]);
  
  // Define loadingMore state for unified feed since useInfiniteScroll doesn't provide it
  const [unifiedFeedLoadingMore, setUnifiedFeedLoadingMore] = useState(false);
  
  // Set up infinite scroll for unified feed
  const {
    loadMoreRef: unifiedFeedLoadMoreRef,
    loading: unifiedFeedLoading,
    hasMore: unifiedFeedHasMore,
    setHasMore: setUnifiedFeedHasMore
  } = useInfiniteScroll(loadMoreUnifiedFeed, { 
    disabled: activeTab !== "feed" || 
      (!events.length && !repliesHasMore && !repostsHasMore)
  });
  
  // Set up infinite scroll for media tab
  const loadMoreMedia = useCallback(() => {
    setPostsLimit(prev => prev + 10);
  }, []);
  
  const {
    loadMoreRef: mediaLoadMoreRef,
    hasMore: mediaHasMore,
    setHasMore: setMediaHasMore
  } = useInfiniteScroll(loadMoreMedia, { 
    disabled: activeTab !== "media" || media.length <= postsLimit
  });
  
  // Update unified feed items when data changes
  useEffect(() => {
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
  }, [events, tabReplies, tabReposts, postsLimit, mergeFeedItems, repliesHasMore, repostsHasMore, repliesLoadingMore, repostsLoadingMore]);
  
  // Update displayed media based on limit
  useEffect(() => {
    const slicedMedia = media.slice(0, postsLimit);
    setDisplayedMedia(slicedMedia);
    
    // Update hasMore state
    if (activeTab === "media") {
      setMediaHasMore(slicedMedia.length < media.length);
    }
  }, [media, postsLimit, activeTab]);
  
  // Combined loading state for unified feed
  const isUnifiedFeedLoading = 
    (events.length === 0 && !tabReplies.length && !tabReposts.length) && 
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
