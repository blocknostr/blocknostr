
import { useState, useEffect } from "react";
import { NostrEvent } from "@/lib/nostr";
import { useProfileFetcher } from "@/components/feed/hooks/use-profile-fetcher";

interface UseProfileTabsOptions {
  events: NostrEvent[];
  media: NostrEvent[];
  reposts: { originalEvent: NostrEvent; repostEvent: NostrEvent }[];
  replies?: NostrEvent[];
  reactions?: NostrEvent[];
  hexPubkey?: string;
}

export function useProfileTabs({
  events,
  media,
  reposts,
  replies = [],
  reactions = [],
  hexPubkey = "",
}: UseProfileTabsOptions) {
  const [activeTab, setActiveTab] = useState("posts");
  const [postsLimit, setPostsLimit] = useState(10);
  const [tabOriginalPostProfiles, setTabOriginalPostProfiles] = useState<Record<string, any>>({});
  const { profiles, fetchProfileData } = useProfileFetcher();
  
  // State for displayed posts (with pagination)
  const [displayedPosts, setDisplayedPosts] = useState<NostrEvent[]>([]);
  const [displayedMedia, setDisplayedMedia] = useState<NostrEvent[]>([]);
  const [displayedReplies, setDisplayedReplies] = useState<NostrEvent[]>([]);
  const [displayedReactions, setDisplayedReactions] = useState<NostrEvent[]>([]);
  
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
      setDisplayedReplies(replies.slice(0, postsLimit));
    }
  }, [activeTab, replies, postsLimit]);
  
  // Update displayed reactions based on limit
  useEffect(() => {
    if (activeTab === "likes") {
      setDisplayedReactions(reactions.slice(0, postsLimit));
    }
  }, [activeTab, reactions, postsLimit]);
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPostsLimit(10); // Reset pagination when changing tabs
  };
  
  // Load more posts when scrolling
  const loadMorePosts = () => {
    setPostsLimit(prev => prev + 10);
  };
  
  // Set up scroll detection for infinite loading
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.innerHeight + document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollThreshold = scrollHeight - 300;
      
      if (scrollPosition > scrollThreshold) {
        loadMorePosts();
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Add profile to the originalPostProfiles collection
  const addProfileToOriginalPosts = (pubkey: string, data: any) => {
    setTabOriginalPostProfiles(prev => ({
      ...prev,
      [pubkey]: data
    }));
  };

  return {
    activeTab,
    handleTabChange,
    postsLimit,
    loadMorePosts,
    displayedPosts,
    displayedMedia,
    displayedReplies,
    displayedReactions,
    tabOriginalPostProfiles,
    addProfileToOriginalPosts,
    profiles
  };
}
