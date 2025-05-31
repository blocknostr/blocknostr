import { useState, useMemo } from 'react';
import { useNoteCardReplies } from './useNoteCardReplies';
import { useNoteReactions } from './useNoteReactions';
import { useProfileMigrated } from '@/hooks/api/useProfileMigrated';

interface UseNoteCardProps {
  event: {
    id: string;
    pubkey: string;
    content: string;
    created_at: number;
    tags?: string[][];
  };
  // Optional profile data to prevent duplicate API calls
  profileData?: {
    displayName?: string | null;
    picture?: string;
    hasData?: boolean;
  };
}

/**
 * 🚀 OPTIMIZED useNoteCard - Race Conditions Eliminated
 * Now accepts optional profile data to prevent duplicate API calls
 * Falls back to useProfileMigrated only when profile data is not provided
 */
export function useNoteCard({ event, profileData }: UseNoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // ✅ FIXED: Use proper conditional hook call with skip parameter
  const hookData = useProfileMigrated(event.pubkey, {
    skip: !!profileData // Skip the API call if profile data is already provided
  });

  // Use provided profile data or fallback to hook data
  const displayName = profileData?.displayName ?? hookData.displayName;
  const picture = profileData?.picture ?? hookData.picture;
  const hasProfileData = profileData?.hasData ?? hookData.hasData;
  
  const { replyCount } = useNoteCardReplies(event.id);
  const reactionHook = useNoteReactions(event.id);
  
  // Memoize processed data
  const noteData = useMemo(() => {
    const contentLength = event.content.length;
    const needsExpansion = contentLength > 280;
    const displayContent = needsExpansion && !isExpanded 
      ? event.content.substring(0, 280) + '...'
      : event.content;
    
    // Format timestamp
    const now = Date.now();
    const eventTime = event.created_at * 1000;
    const diff = now - eventTime;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    let formattedTime;
    if (minutes < 1) {
      formattedTime = 'now';
    } else if (minutes < 60) {
      formattedTime = `${minutes}m ago`;
    } else if (hours < 24) {
      formattedTime = `${hours}h ago`;
    } else if (days < 7) {
      formattedTime = `${days}d ago`;
    } else {
      const timestamp = new Date(eventTime);
      formattedTime = timestamp.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
    
    // Extract hashtags from content
    const hashtags = (event.content.match(/#(\w+)/g) || []).map(tag => tag.slice(1));
    
    return {
      content: displayContent,
      fullContent: event.content,
      needsExpansion,
      formattedTime,
      hashtags
    };
  }, [event.content, event.created_at, isExpanded]);

  // Action handlers
  const toggleExpanded = () => setIsExpanded(!isExpanded);
  
  const handleReply = () => {
    console.log('Reply to note:', event.id);
  };

  return {
    // Note data
    id: event.id,
    pubkey: event.pubkey,
    content: noteData.content,
    fullContent: noteData.fullContent,
    formattedContent: noteData.content,
    needsExpansion: noteData.needsExpansion,
    formattedTime: noteData.formattedTime,
    hashtags: noteData.hashtags,
    
    // Profile data
    displayName,
    picture,
    hasProfileData,
    profileUrl: `/profile/${event.pubkey}`,
    
    // Interaction data
    replyCount,
    likeCount: reactionHook.likeCount || 0,
    repostCount: reactionHook.repostCount || 0,
    userHasLiked: reactionHook.userHasLiked || false,
    userHasReposted: reactionHook.userHasReposted || false,
    isLiking: reactionHook.isLiking || false,
    isReposting: reactionHook.isReposting || false,
    
    // UI state
    isExpanded,
    
    // Actions
    toggleExpanded,
    handleReply,
    handleLike: reactionHook.toggleLike || (() => {}),
    handleRepost: reactionHook.toggleRepost || (() => {}),
    
    // Loading states
    isLoading: profileData ? false : hookData.isLoading
  };
} 

