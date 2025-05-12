
import { useState, useEffect, useCallback } from 'react';
import { nostrService } from '@/lib/nostr';
import { useProfileRelays } from './profile/useProfileRelays';

/**
 * Hook to manage profile data and related functionality
 */
export function useProfileData(pubkey: string | null) {
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followCount, setFollowCount] = useState<number | null>(null);
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  
  // Check if this is the current user's profile
  const isCurrentUser = !!nostrService.publicKey && pubkey === nostrService.publicKey;
  
  // Get relay information using the useProfileRelays hook
  const { 
    relays, 
    loading: relaysLoading, 
    error: relaysError,
    addRelay,
    removeRelay,
    refreshRelays,
    setRelays,
    loadError
  } = useProfileRelays({ 
    pubkey, 
    isCurrentUser 
  });
  
  // Fetch profile data
  const fetchProfileData = useCallback(async () => {
    if (!pubkey) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Get profile data from service
      const profile = await nostrService.getUserProfile(pubkey);
      
      if (profile) {
        setProfileData(profile);
      } else {
        setProfileData(null);
      }
      
      // Get follow counts (placeholder implementation)
      setFollowCount(0);
      setFollowerCount(0);
      
      // Attempt to get real follow counts if available
      try {
        // Fetch followed accounts
        if (isCurrentUser) {
          setFollowCount(nostrService.following.length);
        }
        
        // TODO: Implement follower count
      } catch (err) {
        console.warn("Error fetching follow counts:", err);
      }
    } catch (err) {
      console.error("Error fetching profile data:", err);
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  }, [pubkey, isCurrentUser]);
  
  // Fetch profile data on mount or when pubkey changes
  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);
  
  // Check if user is being followed
  const isFollowing = useCallback(() => {
    if (!pubkey || !nostrService.publicKey) return false;
    return nostrService.isFollowing(pubkey);
  }, [pubkey]);
  
  // Follow a user
  const followUser = useCallback(async () => {
    if (!pubkey || !nostrService.publicKey) return false;
    
    try {
      const success = await nostrService.followUser(pubkey);
      return success;
    } catch (err) {
      console.error("Error following user:", err);
      return false;
    }
  }, [pubkey]);
  
  // Unfollow a user
  const unfollowUser = useCallback(async () => {
    if (!pubkey || !nostrService.publicKey) return false;
    
    try {
      const success = await nostrService.unfollowUser(pubkey);
      return success;
    } catch (err) {
      console.error("Error unfollowing user:", err);
      return false;
    }
  }, [pubkey]);

  return {
    profileData,
    loading,
    error,
    fetchProfileData,
    isCurrentUser,
    isFollowing: isFollowing(),
    followUser,
    unfollowUser,
    followCount,
    followerCount,
    relays,
    relaysLoading,
    relaysError: loadError, // Use loadError from useProfileRelays
    addRelay,
    removeRelay,
    refreshRelays,
    setRelays
  };
}
