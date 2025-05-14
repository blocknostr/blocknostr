
import { useState, useEffect, useCallback, useRef } from "react";
import { NostrEvent } from "@/lib/nostr";
import { useProfileFetcher } from "@/components/feed/hooks/use-profile-fetcher";
import { useProfileReplies } from "@/hooks/profile/useProfileReplies";
import { useProfileLikes } from "@/hooks/profile/useProfileLikes";
import { useProfileReposts } from "@/hooks/profile/useProfileReposts";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";

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
  reactions = [],
  referencedEvents = {},
  hexPubkey = ""
}: UseProfileTabsDataProps) {
  const { profiles, fetchProfileData } = useProfileFetcher();
  const [activeTab, setActiveTab] = useState("posts");
  const [loadingReactionProfiles, setLoadingReactionProfiles] = useState(false);
  const [localOriginalPostProfiles, setLocalOriginalPostProfiles] = useState(originalPostProfiles);
  const [postsLimit, setPostsLimit] = useState(10);
  
  // State for displayed posts (with pagination)
  const [displayedPosts, setDisplayedPosts] = useState<NostrEvent[]>([]);
  const [displayedMedia, setDisplayedMedia] = useState<NostrEvent[]>([]);
  
  // Tab-specific data loading hooks with progressive loading
  const { 
    replies: tabReplies, 
    loading: repliesLoading,
    loadingMore: repliesLoadingMore,
    hasMore: repliesHasMore,
    loadMore: loadMoreReplies 
  } = useProfileReplies({ 
    hexPubkey, 
    enabled: activeTab === "replies", 
    initialLimit: 10
  });
  
  const { 
    reactions: tabReactions, 
    referencedEvents: tabReferencedEvents, 
    loading: reactionsLoading,
    loadingMore: reactionsLoadingMore,
    hasMore: reactionsHasMore,
    loadMore: loadMoreReactions
  } = useProfileLikes({ 
    hexPubkey, 
    enabled: activeTab === "likes",
    initialLimit: 10
  });
  
  // Properly use the hook at the component level
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
    enabled: activeTab === "reposts",
    initialLimit: 10
  });
  
  // State for displayed replies and reactions
  const [displayedReplies, setDisplayedReplies] = useState<NostrEvent[]>([]);
  const [displayedReactions, setDisplayedReactions] = useState<NostrEvent[]>([]);
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPostsLimit(10); // Reset pagination when changing tabs
  };
  
  // Load more handler for posts tab
  const loadMorePosts = useCallback(() => {
    setPostsLimit(prev => prev + 10);
  }, []);
  
  // Set up infinite scroll for posts tab
  const {
    loadMoreRef: postsLoadMoreRef,
    loading: postsLoading,
    setLoading: setPostsLoading,
    hasMore: postsHasMore,
    setHasMore: setPostsHasMore
  } = useInfiniteScroll(loadMorePosts, { 
    disabled: activeTab !== "posts" || events.length <= postsLimit
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
  
  // Set up infinite scroll for replies tab
  const {
    loadMoreRef: repliesLoadMoreRef
  } = useInfiniteScroll(loadMoreReplies, { 
    disabled: activeTab !== "replies" || !repliesHasMore || repliesLoadingMore
  });
  
  // Set up infinite scroll for reposts tab
  const {
    loadMoreRef: repostsLoadMoreRef
  } = useInfiniteScroll(loadMoreReposts, { 
    disabled: activeTab !== "reposts" || !repostsHasMore || repostsLoadingMore
  });
  
  // Set up infinite scroll for likes tab
  const {
    loadMoreRef: likesLoadMoreRef
  } = useInfiniteScroll(loadMoreReactions, { 
    disabled: activeTab !== "likes" || !reactionsHasMore || reactionsLoadingMore
  });
  
  // Update displayed posts based on limit
  useEffect(() => {
    const slicedPosts = events.slice(0, postsLimit);
    setDisplayedPosts(slicedPosts);
    
    // Update hasMore state
    if (activeTab === "posts") {
      setPostsHasMore(slicedPosts.length < events.length);
    }
  }, [events, postsLimit, activeTab]);
  
  // Update displayed media based on limit
  useEffect(() => {
    const slicedMedia = media.slice(0, postsLimit);
    setDisplayedMedia(slicedMedia);
    
    // Update hasMore state
    if (activeTab === "media") {
      setMediaHasMore(slicedMedia.length < media.length);
    }
  }, [media, postsLimit, activeTab]);
  
  // Update displayed replies based on the tab replies
  useEffect(() => {
    if (activeTab === "replies") {
      const repliesData = tabReplies.length > 0 ? tabReplies : replies;
      setDisplayedReplies(repliesData);
    }
  }, [activeTab, tabReplies, replies]);
  
  // Update displayed reactions based on tab reactions
  useEffect(() => {
    if (activeTab === "likes") {
      const reactionsData = tabReactions.length > 0 ? tabReactions : reactions || [];
      setDisplayedReactions(reactionsData);
    }
  }, [activeTab, tabReactions, reactions]);
  
  // Fetch profiles for reaction posts when likes tab is active
  useEffect(() => {
    const fetchReactionProfiles = async () => {
      // Only fetch if we're on the likes tab and have referenced events
      if (activeTab !== "likes" || !tabReferencedEvents || Object.keys(tabReferencedEvents).length === 0) {
        return;
      }
      
      setLoadingReactionProfiles(true);
      
      try {
        // Get unique author pubkeys from referenced events
        const authorPubkeys = Object.values(tabReferencedEvents)
          .filter(event => !!event?.pubkey)
          .map(event => event.pubkey);
        
        if (authorPubkeys.length === 0) {
          setLoadingReactionProfiles(false);
          return;
        }
        
        // Fetch profiles for all authors
        const uniquePubkeys = [...new Set(authorPubkeys)];
        
        for (const pubkey of uniquePubkeys) {
          try {
            await fetchProfileData(pubkey);
          } catch (error) {
            console.error(`Error fetching profile for ${pubkey}:`, error);
          }
        }
      } catch (error) {
        console.error("Error fetching reaction profiles:", error);
      } finally {
        setLoadingReactionProfiles(false);
      }
    };
    
    fetchReactionProfiles();
  }, [activeTab, tabReferencedEvents, fetchProfileData]);

  return {
    activeTab,
    handleTabChange,
    postsLimit,
    profiles,
    displayedPosts,
    displayedMedia,
    displayedReplies,
    displayedReactions,
    repliesLoading,
    repostsLoading,
    reactionsLoading,
    repliesLoadingMore,
    repostsLoadingMore,
    reactionsLoadingMore,
    repliesHasMore,
    repostsHasMore,
    reactionsHasMore,
    loadingReactionProfiles,
    tabReposts,
    tabReferencedEvents,
    localOriginalPostProfiles,
    referencedEvents,
    postsLoadMoreRef,
    mediaLoadMoreRef,
    repliesLoadMoreRef,
    repostsLoadMoreRef,
    likesLoadMoreRef,
    postsHasMore,
    mediaHasMore
  };
}
