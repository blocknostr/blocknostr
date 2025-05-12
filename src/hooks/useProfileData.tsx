
import { useState, useEffect } from 'react';
import { useProfileMetadata } from './profile/useProfileMetadata';
import { useProfilePosts } from './profile/useProfilePosts';
import { useProfileRelations } from './profile/useProfileRelations';
import { useProfileReposts } from './profile/useProfileReposts';
import { useProfileRelays } from './profile/useProfileRelays';
import { useProfileReplies } from './profile/useProfileReplies';
import { useProfileLikes } from './profile/useProfileLikes';
import { nostrService } from '@/lib/nostr';
import { useConnectionStatus } from './profile/useConnectionStatus';
import { useProfileDebugInfo } from './profile/useProfileDebugInfo';
import { useProfileRefresh } from './profile/useProfileRefresh';

interface UseProfileDataProps {
  npub: string | undefined;
  currentUserPubkey: string | null;
}

export function useProfileData({ npub, currentUserPubkey }: UseProfileDataProps) {
  // State for tracking original post profiles (used in reposts)
  const [originalPostProfiles, setOriginalPostProfiles] = useState<Record<string, any>>({});
  
  // Get profile metadata and loading state
  const { 
    profileData, 
    loading: metadataLoading, 
    isCurrentUser,
    hexNpub,
    error: metadataError,
    refetch: refetchProfile
  } = useProfileMetadata({ npub, currentUserPubkey });
  
  // Use connection status hook
  const { connectionStatus, errorMessage, setErrorMessage } = useConnectionStatus({
    loading: metadataLoading,
    error: metadataError,
    profileData
  });
  
  // Use debug info hook
  useProfileDebugInfo({ 
    npub, 
    hexNpub, 
    loading: metadataLoading, 
    profileData 
  });
  
  // Use refresh hook
  const { refreshCounter, refreshProfile: refreshProfileBase } = useProfileRefresh();
  
  // Get user's posts and media with improved error handling
  const { 
    events, 
    media, 
    loading: postsLoading,
    error: postsError,
    refetch: refetchPosts 
  } = useProfilePosts({ 
    hexPubkey: hexNpub 
  });
  
  // Update error state if posts loading fails
  useEffect(() => {
    if (postsError && !metadataError) {
      setErrorMessage(postsError);
    }
  }, [postsError, metadataError]);
  
  // Get followers and following with improved error handling
  const { 
    followers, 
    following, 
    isLoading: relationsLoading,
    hasError: relationsHasError,
    errorMessage: relationsError,
    refetch: refetchRelations
  } = useProfileRelations({ 
    hexPubkey: hexNpub, 
    isCurrentUser 
  });
  
  // Update error state if relations loading fails
  useEffect(() => {
    if (relationsHasError && !metadataError && !postsError) {
      setErrorMessage(relationsError || "Failed to load profile connections");
    }
  }, [relationsHasError, relationsError, metadataError, postsError]);
  
  // Log followers and following counts for debugging
  useEffect(() => {
    if (!relationsLoading) {
      console.log(`Profile relations: ${followers.length} followers, ${following.length} following`);
    }
  }, [followers, following, relationsLoading]);
  
  // Get reposts and handle fetching original posts
  const { 
    reposts, 
    replies: repostReplies, 
    fetchOriginalPost
  } = useProfileReposts({ 
    originalPostProfiles, 
    setOriginalPostProfiles 
  });
  
  // Get relays information with improved error handling
  const { 
    relays, 
    setRelays,
    refreshRelays,
    loadError: relaysError
  } = useProfileRelays({ 
    isCurrentUser,
    pubkey: hexNpub
  });
  
  // Update error state if relays loading fails
  useEffect(() => {
    if (relaysError && !metadataError && !postsError && !relationsError) {
      setErrorMessage(relaysError);
    }
  }, [relaysError, metadataError, postsError, relationsError]);
  
  // Get replies (NIP-10)
  const { replies } = useProfileReplies({
    hexPubkey: hexNpub
  });
  
  // Get likes/reactions (NIP-25)
  const { reactions, referencedEvents } = useProfileLikes({
    hexPubkey: hexNpub
  });
  
  // Log post counts for debugging
  useEffect(() => {
    if (events.length > 0 || reposts.length > 0) {
      console.log(`Profile posts: ${events.length} posts, ${reposts.length} reposts`);
    }
  }, [events, reposts]);
  
  // Determine overall loading state
  const loading = metadataLoading || (postsLoading && events.length === 0);
  
  // Enhanced refresh function that calls all refresh methods
  const refreshProfile = useCallback(async () => {
    // Reset error state
    setErrorMessage(null);
    
    // Refresh relays first
    if (refreshRelays) {
      refreshRelays();
    }
    
    // Trigger the individual refresh functions
    if (refetchProfile) refetchProfile();
    if (refetchPosts) refetchPosts();
    if (refetchRelations) refetchRelations();
    
    // Clear cached data
    setOriginalPostProfiles({});
    
    // Call base refresh function
    return refreshProfileBase();
  }, [refetchProfile, refetchPosts, refetchRelations, refreshRelays, refreshProfileBase]);
  
  return {
    profileData,
    events,
    replies,
    media,
    reposts,
    loading,
    error: errorMessage,
    relays,
    setRelays,
    followers,
    following,
    originalPostProfiles,
    isCurrentUser,
    reactions,
    referencedEvents,
    refreshProfile,
    connectionStatus
  };
}
