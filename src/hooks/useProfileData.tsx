
import { useState, useCallback } from 'react';
import { useProfileMetadata } from './profile/useProfileMetadata';
import { useProfilePosts } from './profile/useProfilePosts';
import { useProfileRelations } from './profile/useProfileRelations';
import { useProfileReposts } from './profile/useProfileReposts';
import { useProfileRelays } from './profile/useProfileRelays';
import { ProfileUtils } from '@/lib/nostr/utils/profileUtils';

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
    loading, 
    isCurrentUser,
    hexNpub,
    refreshProfile
  } = useProfileMetadata({ npub, currentUserPubkey });
  
  // Get user's posts and media
  const { events, media, isLoading: postsLoading } = useProfilePosts({ 
    hexPubkey: hexNpub 
  });
  
  // Get followers and following
  const { 
    followers, 
    following, 
    isLoading: relationsLoading 
  } = useProfileRelations({ 
    hexPubkey: hexNpub, 
    isCurrentUser 
  });
  
  // Get reposts and handle fetching original posts
  const { 
    reposts, 
    replies, 
    fetchOriginalPost,
    isLoading: repostsLoading 
  } = useProfileReposts({ 
    originalPostProfiles, 
    setOriginalPostProfiles 
  });
  
  // Get relays information
  const { 
    relays, 
    setRelays,
    isLoading: relaysLoading 
  } = useProfileRelays({ 
    isCurrentUser,
    pubkey: hexNpub
  });
  
  // Function to fetch profile data for any pubkey with caching
  const fetchProfileData = useCallback(async (pubkey: string) => {
    return ProfileUtils.fetchProfile(pubkey, {
      cachePriority: "normal",
      includeRelays: false
    });
  }, []);
  
  // Determine if any data is still loading
  const isLoading = loading || postsLoading || relationsLoading || repostsLoading || relaysLoading;
  
  return {
    profileData,
    events,
    replies,
    media,
    reposts,
    loading: isLoading,
    relays,
    setRelays,
    followers,
    following,
    originalPostProfiles,
    isCurrentUser,
    fetchProfileData,
    refreshProfile
  };
}
