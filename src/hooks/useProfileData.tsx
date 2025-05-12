
import { useState, useEffect, useCallback } from 'react';
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
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'failed' | null>(null);
  
  // Get profile metadata and loading state
  const { 
    profileData, 
    loading: metadataLoading, 
    isCurrentUser,
    hexNpub,
    error: metadataError,
    refetch: refetchProfile
  } = useProfileMetadata({ npub, currentUserPubkey });
  
  // Track connection status
  useEffect(() => {
    if (metadataLoading) {
      setConnectionStatus('connecting');
    } else if (metadataError) {
      setConnectionStatus('failed');
      setError(metadataError);
    } else if (profileData) {
      setConnectionStatus('connected');
      setError(null);
    }
  }, [metadataLoading, metadataError, profileData]);
  
  // Log important information for debugging
  useEffect(() => {
    if (npub) {
      console.log("Profile page for npub:", npub);
      
      try {
        const hex = nostrService.getHexFromNpub(npub);
        console.log("Converted to hex pubkey:", hex);
      } catch (error) {
        console.error("Error converting npub to hex:", error);
        setError("Invalid profile identifier. Please check the URL.");
      }
    }
    
    if (hexNpub) {
      console.log("Using hex pubkey for profile:", hexNpub);
    }
    
    if (metadataLoading) {
      console.log("Profile data loading...");
    } else {
      console.log("Profile data loaded:", profileData ? "success" : "not found");
    }
  }, [npub, hexNpub, metadataLoading, profileData]);
  
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
      setError(postsError);
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
      setError(relationsError || "Failed to load profile connections");
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
    fetchOriginalPost,
    // Replace 'loading' property with renamed variable to avoid TypeScript error
    // since this object doesn't have a 'loading' property
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
      setError(relaysError);
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
  
  // Set up listeners for refresh events
  useEffect(() => {
    const handleRefetchEvents = (e: Event) => {
      console.log("Received refetch event");
      setRefreshCounter(prev => prev + 1);
      
      // Clear any existing errors on refresh
      setError(null);
    };
    
    window.addEventListener('refetchProfile', handleRefetchEvents);
    window.addEventListener('refetchPosts', handleRefetchEvents);
    window.addEventListener('refetchRelations', handleRefetchEvents);
    
    return () => {
      window.removeEventListener('refetchProfile', handleRefetchEvents);
      window.removeEventListener('refetchPosts', handleRefetchEvents);
      window.removeEventListener('refetchRelations', handleRefetchEvents);
    };
  }, []);
  
  // Determine overall loading state
  const loading = metadataLoading || (postsLoading && events.length === 0);
  
  // Function to refresh all profile data
  const refreshProfile = useCallback(async () => {
    console.log("Refreshing all profile data");
    
    // Reset error state
    setError(null);
    
    // Ensure we're connected to relays
    await nostrService.connectToUserRelays();
    
    // Add more popular relays to increase chances of success
    await nostrService.addMultipleRelays([
      "wss://relay.damus.io", 
      "wss://nos.lol", 
      "wss://relay.nostr.band",
      "wss://relay.snort.social",
      "wss://nostr.mutinywallet.com"
    ]).catch(err => console.warn("Error adding additional relays:", err));
    
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
    
    // Update the refresh counter to trigger rerender
    setRefreshCounter(prev => prev + 1);
    
    // Wait a bit to allow data to load
    return new Promise<void>(resolve => setTimeout(resolve, 2000));
  }, [refetchProfile, refetchPosts, refetchRelations, refreshRelays]);
  
  return {
    profileData,
    events,
    replies,
    media,
    reposts,
    loading,
    error,
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
