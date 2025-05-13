
import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { nostrService } from '@/lib/nostr';
import { useProfileStore } from '@/lib/stores/profileStore';
import { convertToHexPubkey } from '@/lib/utils/pubkeyUtils';
import { useProfileEvents } from './useProfileEvents';

interface UseProfileCoreProps {
  npub: string | undefined;
  currentUserPubkey: string | null;
}

export function useProfileCore({ npub, currentUserPubkey }: UseProfileCoreProps) {
  const {
    profileData,
    loading,
    error,
    refreshing,
    loadProfile,
    refreshProfile,
    setLoading,
    setError
  } = useProfileStore();
  
  const timeoutRef = useRef<number | null>(null);
  const isMounted = useRef(true);
  
  // Convert npub to hex
  const hexNpub = convertToHexPubkey(npub);
  
  // Set up event listeners for profile data updates
  useProfileEvents(hexNpub);
  
  // Initial load
  useEffect(() => {
    isMounted.current = true;
    
    if (!npub && !hexNpub) {
      setError('Invalid profile identifier');
      setLoading(false);
      return;
    }
    
    console.log("Loading profile for:", npub || hexNpub);
    loadProfile(npub, currentUserPubkey)
      .catch(err => {
        console.error("Error loading profile:", err);
        toast.error("Failed to load profile");
      });
    
    // Set a timeout to ensure loading doesn't hang indefinitely
    timeoutRef.current = window.setTimeout(() => {
      if (isMounted.current && loading) {
        setLoading(false);
        if (!profileData?.metadata) {
          setError('Profile loading timed out');
          toast.error('Profile loading timed out');
        }
      }
    }, 15000);
    
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [npub, currentUserPubkey, hexNpub, loadProfile, setError, setLoading, loading, profileData]);
  
  // Function to refresh profile data with standardized error handling
  const handleRefreshProfile = useCallback(async () => {
    if (refreshing) return;
    
    try {
      toast.loading("Refreshing profile data...");
      await refreshProfile(npub, currentUserPubkey);
    } catch (error) {
      console.error("Error refreshing profile:", error);
      toast.error("Failed to refresh profile");
    }
  }, [npub, currentUserPubkey, refreshing, refreshProfile]);
  
  // Return processed data and actions
  return {
    profileData: profileData || {
      metadata: null,
      posts: [],
      media: [],
      reposts: [],
      replies: [],
      reactions: [],
      referencedEvents: {},
      followers: [],
      following: [],
      relays: [],
      originalPostProfiles: {},
      isCurrentUser: currentUserPubkey ? npub === currentUserPubkey : false,
      hexPubkey: hexNpub
    },
    loading,
    error,
    refreshing,
    refreshProfile: handleRefreshProfile,
    
    // These provide individual parts of profile data for components that need them
    metadata: profileData?.metadata || null,
    posts: profileData?.posts || [],
    media: profileData?.media || [],
    followers: profileData?.followers || [],
    following: profileData?.following || [],
    relays: profileData?.relays || [],
    isCurrentUser: profileData?.isCurrentUser || false
  };
}
