
import { useState, useEffect, useRef } from "react";
import { NostrEvent } from "@/lib/nostr";
import { useProfileFetcher } from "@/components/feed/hooks/use-profile-fetcher";
import { useProfileReplies } from "@/hooks/profile/useProfileReplies";
import { useProfileLikes } from "@/hooks/profile/useProfileLikes";
import { useProfileReposts } from "@/hooks/profile/useProfileReposts";

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
  const [displayedReplies, setDisplayedReplies] = useState<NostrEvent[]>([]);
  const [displayedReactions, setDisplayedReactions] = useState<NostrEvent[]>([]);

  // Tab-specific data loading hooks
  const { 
    replies: tabReplies, 
    loading: repliesLoading 
  } = useProfileReplies({ 
    hexPubkey, 
    enabled: activeTab === "replies" 
  });
  
  const { 
    reactions: tabReactions, 
    referencedEvents: tabReferencedEvents, 
    loading: reactionsLoading 
  } = useProfileLikes({ 
    hexPubkey, 
    enabled: activeTab === "likes" 
  });
  
  // Properly use the hook at the component level
  const {
    reposts: tabReposts,
    loading: repostsLoading
  } = useProfileReposts({
    hexPubkey,
    originalPostProfiles: localOriginalPostProfiles,
    setOriginalPostProfiles: setLocalOriginalPostProfiles,
    enabled: activeTab === "reposts"
  });
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPostsLimit(10); // Reset pagination when changing tabs
  };
  
  // Load more posts when scrolling
  const loadMorePosts = () => {
    setPostsLimit(prev => prev + 10);
  };
  
  // Update displayed posts based on limit
  useEffect(() => {
    setDisplayedPosts(events.slice(0, postsLimit));
  }, [events, postsLimit]);
  
  // Update displayed media based on limit
  useEffect(() => {
    setDisplayedMedia(media.slice(0, postsLimit));
  }, [media, postsLimit]);
  
  // Update displayed replies based on limit
  useEffect(() => {
    if (activeTab === "replies") {
      const repliesData = tabReplies.length > 0 ? tabReplies : replies;
      setDisplayedReplies(repliesData.slice(0, postsLimit));
    }
  }, [activeTab, tabReplies, replies, postsLimit]);
  
  // Update displayed reactions based on limit
  useEffect(() => {
    if (activeTab === "likes") {
      const reactionsData = tabReactions.length > 0 ? tabReactions : reactions || [];
      setDisplayedReactions(reactionsData.slice(0, postsLimit));
    }
  }, [activeTab, tabReactions, reactions, postsLimit]);
  
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
  
  // Detect when we're near the bottom to load more
  const handleScroll = () => {
    const scrollPosition = window.innerHeight + document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollThreshold = scrollHeight - 300;
    
    if (scrollPosition > scrollThreshold) {
      loadMorePosts();
    }
  };
  
  // Add scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    loadingReactionProfiles,
    tabReposts,
    tabReferencedEvents,
    localOriginalPostProfiles,
    referencedEvents
  };
}
