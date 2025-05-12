
import { useState, useEffect } from 'react';
import { useProfileMetadata } from './profile/useProfileMetadata';
import { useProfilePosts } from './profile/useProfilePosts';
import { useProfileRelations } from './profile/useProfileRelations';
import { useProfileReposts } from './profile/useProfileReposts';
import { useProfileRelays } from './profile/useProfileRelays';
import { useProfileReplies } from './profile/useProfileReplies';
import { useProfileLikes } from './profile/useProfileLikes';
import { nostrService } from '@/lib/nostr';

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
  
  // Log important information for debugging
  useEffect(() => {
    if (npub) {
      console.log("Profile page for npub:", npub);
      
      try {
        const hex = nostrService.getHexFromNpub(npub);
        console.log("Converted to hex pubkey:", hex);
      } catch (error) {
        console.error("Error converting npub to hex:", error);
      }
    }
    
    if (hexNpub) {
      console.log("Using hex pubkey for profile:", hexNpub);
    }
    
    if (loading) {
      console.log("Profile data loading...");
    } else {
      console.log("Profile data loaded:", profileData ? "success" : "not found");
    }
  }, [npub, hexNpub, loading, profileData]);
  
  // Get user's posts and media
  const { events, media } = useProfilePosts({ 
    hexPubkey: hexNpub 
  });
  
  // Get followers and following
  const { followers, following, isLoading: relationsLoading } = useProfileRelations({ 
    hexPubkey: hexNpub, 
    isCurrentUser 
  });
  
  // Log followers and following counts for debugging
  useEffect(() => {
    if (!relationsLoading) {
      console.log(`Profile relations: ${followers.length} followers, ${following.length} following`);
    }
  }, [followers, following, relationsLoading]);
  
  // Get reposts and handle fetching original posts
  const { reposts, replies: repostReplies, fetchOriginalPost } = useProfileReposts({ 
    originalPostProfiles, 
    setOriginalPostProfiles 
  });
  
  // Get relays information
  const { relays, setRelays } = useProfileRelays({ 
    isCurrentUser,
    pubkey: hexNpub
  });
  
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
    isCurrentUser,
    reactions,
    referencedEvents
  };
}
