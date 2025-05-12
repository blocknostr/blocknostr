
import { useState } from 'react';
import { useProfileMetadata } from './profile/useProfileMetadata';
import { useProfilePosts } from './profile/useProfilePosts';
import { useProfileRelations } from './profile/useProfileRelations';
import { useProfileReposts } from './profile/useProfileReposts';
import { useProfileRelays } from './profile/useProfileRelays';

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
    hexNpub
  } = useProfileMetadata({ npub, currentUserPubkey });
  
  // Get user's posts and media
  const { events, media } = useProfilePosts({ 
    hexPubkey: hexNpub 
  });
  
  // Get followers and following
  const { followers, following } = useProfileRelations({ 
    hexPubkey: hexNpub, 
    isCurrentUser 
  });
  
  // Get reposts and handle fetching original posts
  const { reposts, replies, fetchOriginalPost } = useProfileReposts({ 
    originalPostProfiles, 
    setOriginalPostProfiles 
  });
  
  // Get relays information
  const { relays, setRelays } = useProfileRelays({ 
    isCurrentUser 
  });
  
  return {
    profileData,
    events,
    replies,
    media,
    reposts,
    loading,
    relays,
    setRelays,
    followers,
    following,
    originalPostProfiles,
    isCurrentUser
  };
}
