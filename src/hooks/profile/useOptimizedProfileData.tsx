
import { useState, useEffect, useCallback } from 'react';
import { nostrService } from '@/lib/nostr';
import { useProfilePosts } from './useProfilePosts';
import { useProfileReplies } from './useProfileReplies';
import { useProfileLikes } from './useProfileLikes';
import { useProfileReposts } from './useProfileReposts';
import { useProfileFetcher } from '@/components/feed/hooks/use-profile-fetcher';

export const useOptimizedProfileData = (hexPubkey: string | undefined) => {
  const [activeTab, setActiveTab] = useState<string>('posts');
  const [originalPostProfiles, setOriginalPostProfiles] = useState<Record<string, any>>({});
  
  // Core profile data (always loaded)
  const { profiles, fetchProfileData } = useProfileFetcher();
  
  // Posts tab data (loaded immediately)
  const {
    events: posts,
    media,
    loading: postsLoading,
    error: postsError,
    refetch: refetchPosts
  } = useProfilePosts({ hexPubkey });
  
  // Replies tab data (lazy loaded)
  const { replies, loading: repliesLoading } = useProfileReplies({ 
    hexPubkey: activeTab === 'replies' ? hexPubkey : undefined 
  });
  
  // Likes tab data (lazy loaded)
  const { 
    reactions, 
    referencedEvents, 
    loading: likesLoading 
  } = useProfileLikes({ 
    hexPubkey: activeTab === 'likes' ? hexPubkey : undefined 
  });
  
  // Reposts tab data (lazy loaded)
  const { 
    reposts, 
    fetchOriginalPost 
  } = useProfileReposts({ 
    originalPostProfiles, 
    setOriginalPostProfiles 
  });
  
  // Handle tab changes
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    
    // Prefetch data for the selected tab if needed
    if (tab === 'reposts' && hexPubkey) {
      // Implement repost fetching logic when tab is selected
      // This is just a placeholder - the actual implementation would depend on your data model
      console.log('Fetching reposts for', hexPubkey);
    }
  }, [hexPubkey]);
  
  // For any profile we load, also fetch their profile data
  useEffect(() => {
    if (!hexPubkey) return;
    
    // Always fetch the main profile
    fetchProfileData(hexPubkey);
    
    // When posts load, prefetch profile data for authors of quoted or referenced posts
    if (posts && posts.length > 0) {
      // Find referenced authors in posts
      const referencedAuthors = new Set<string>();
      
      posts.forEach(post => {
        // Add reference authors from tags
        post.tags?.forEach(tag => {
          if (tag[0] === 'p' && tag[1] && tag[1] !== hexPubkey) {
            referencedAuthors.add(tag[1]);
          }
        });
      });
      
      // Fetch profiles for referenced authors (limit to 5 at a time to avoid overwhelming)
      Array.from(referencedAuthors).slice(0, 5).forEach(pubkey => {
        fetchProfileData(pubkey);
      });
    }
  }, [hexPubkey, posts, fetchProfileData]);
  
  return {
    activeTab,
    handleTabChange,
    
    // Data for different tabs
    posts,
    media,
    replies,
    reactions,
    reposts,
    
    // Additional context
    referencedEvents,
    originalPostProfiles,
    profiles,
    
    // Loading states
    postsLoading,
    repliesLoading,
    likesLoading,
    
    // Actions
    refetchPosts,
    fetchOriginalPost,
  };
};
