import { useState, useEffect, useCallback, useRef } from 'react';
import { ProfileData, profileDataService } from '@/lib/services/ProfileDataService';
import { toast } from 'sonner';
import { nostrService } from '@/lib/nostr';

interface UseProfileServiceProps {
  npub: string | undefined;
  currentUserPubkey: string | null;
}

export function useProfileService({ npub, currentUserPubkey }: UseProfileServiceProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const isMounted = useRef(true);
  const pubkeyRef = useRef<string | null>(null);
  
  // Convert npub to hex for tracking
  const hexNpub = useCallback(() => {
    try {
      if (!npub) return null;
      
      // Check if it's already a hex key (64 chars)
      if (npub.length === 64 && /^[0-9a-f]+$/i.test(npub)) {
        return npub;
      }
      
      // Otherwise convert from npub
      if (npub.startsWith('npub1')) {
        return nostrService.getHexFromNpub(npub);
      }
      
      console.warn("Unrecognized pubkey format:", npub);
      return npub; // Return as-is as a fallback
    } catch (error) {
      console.error("Error converting pubkey format:", error);
      return null;
    }
  }, [npub])();
  
  // Set up listeners and initial data loading
  useEffect(() => {
    console.log("useProfileService running with npub:", npub, "hex:", hexNpub);
    
    isMounted.current = true;
    pubkeyRef.current = hexNpub;
    
    // Reset state
    setLoading(true);
    setError(null);
    
    // Define event handlers for service updates
    const handleMetadataUpdated = (pubkey: string, metadata: any) => {
      if (!isMounted.current || pubkey !== pubkeyRef.current) return;
      
      setProfileData(prev => {
        if (!prev) return null;
        return { ...prev, metadata };
      });
    };
    
    const handlePostsUpdated = (pubkey: string, posts: any[]) => {
      if (!isMounted.current || pubkey !== pubkeyRef.current) return;
      
      setProfileData(prev => {
        if (!prev) return null;
        return { ...prev, posts };
      });
    };
    
    const handleMediaUpdated = (pubkey: string, media: any[]) => {
      if (!isMounted.current || pubkey !== pubkeyRef.current) return;
      
      setProfileData(prev => {
        if (!prev) return null;
        return { ...prev, media };
      });
    };
    
    const handleRelationsUpdated = (pubkey: string, relations: { followers: any[], following: any[] }) => {
      if (!isMounted.current || pubkey !== pubkeyRef.current) return;
      
      setProfileData(prev => {
        if (!prev) return null;
        return { 
          ...prev, 
          followers: relations.followers,
          following: relations.following
        };
      });
    };
    
    const handleRelaysUpdated = (pubkey: string, relays: any[]) => {
      if (!isMounted.current || pubkey !== pubkeyRef.current) return;
      
      setProfileData(prev => {
        if (!prev) return null;
        return { ...prev, relays };
      });
    };
    
    const handleReactionsUpdated = (pubkey: string, data: { 
      reactions: any[], 
      referencedEvents: Record<string, any> 
    }) => {
      if (!isMounted.current || pubkey !== pubkeyRef.current) return;
      
      setProfileData(prev => {
        if (!prev) return null;
        return { 
          ...prev, 
          reactions: data.reactions,
          referencedEvents: data.referencedEvents
        };
      });
    };
    
    const handleLoadingStateChanged = (pubkey: string, loadingState: any) => {
      if (!isMounted.current || pubkey !== pubkeyRef.current) return;
      
      // Metadata is most critical for UI
      if (loadingState.metadata === 'success') {
        setLoading(false);
        setRefreshing(false);
      } else if (loadingState.metadata === 'error') {
        if (loadingState.posts === 'error') {
          setError('Failed to load profile data');
          setLoading(false);
          setRefreshing(false);
        }
      }
      
      // Show error toast only on significant errors
      if (loadingState.metadata === 'error' && loadingState.posts === 'error') {
        toast.error('Failed to load profile data');
      }
    };
    
    // Register event handlers
    profileDataService.on('metadata-updated', handleMetadataUpdated);
    profileDataService.on('posts-updated', handlePostsUpdated);
    profileDataService.on('media-updated', handleMediaUpdated);
    profileDataService.on('relations-updated', handleRelationsUpdated);
    profileDataService.on('relays-updated', handleRelaysUpdated);
    profileDataService.on('reactions-updated', handleReactionsUpdated);
    profileDataService.on('loading-state-changed', handleLoadingStateChanged);
    
    // Initial data load
    const loadProfile = async () => {
      if (!npub && !hexNpub) {
        setError('Invalid profile identifier');
        setLoading(false);
        return;
      }
      
      try {
        console.log("Loading profile for:", npub || hexNpub);
        // Initialize data
        const initialData = await profileDataService.loadProfileData(npub, currentUserPubkey);
        
        if (isMounted.current) {
          console.log("Profile data loaded:", initialData?.metadata?.name || hexNpub);
          setProfileData(initialData);
          
          // If we already have metadata, we can stop showing the main loader
          if (initialData.metadata) {
            setLoading(false);
          }
          
          // Handle error case
          if (!initialData.metadata && !initialData.hexPubkey) {
            setError('Invalid profile identifier');
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        if (isMounted.current) {
          setError('Failed to load profile data');
          setLoading(false);
        }
      }
    };
    
    loadProfile();
    
    // Set a timeout to ensure loading doesn't hang indefinitely
    const timeoutId = setTimeout(() => {
      if (isMounted.current && loading) {
        setLoading(false);
        if (!profileData?.metadata) {
          setError('Profile loading timed out');
          toast.error('Profile loading timed out');
        }
      }
    }, 15000);
    
    // Clean up listeners and timeouts
    return () => {
      isMounted.current = false;
      clearTimeout(timeoutId);
      
      profileDataService.removeListener('metadata-updated', handleMetadataUpdated);
      profileDataService.removeListener('posts-updated', handlePostsUpdated);
      profileDataService.removeListener('media-updated', handleMediaUpdated);
      profileDataService.removeListener('relations-updated', handleRelationsUpdated);
      profileDataService.removeListener('relays-updated', handleRelaysUpdated);
      profileDataService.removeListener('reactions-updated', handleReactionsUpdated);
      profileDataService.removeListener('loading-state-changed', handleLoadingStateChanged);
    };
  }, [npub, currentUserPubkey, hexNpub]);
  
  // Function to refresh profile data
  const refreshProfile = useCallback(async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    toast.loading("Refreshing profile data...");
    
    try {
      await profileDataService.refreshProfileData(npub, currentUserPubkey);
      
      // Note: We don't need to set refreshing to false here,
      // as the loading-state-changed event will do that
    } catch (error) {
      console.error("Error refreshing profile:", error);
      toast.error("Failed to refresh profile");
      setRefreshing(false);
    }
  }, [npub, currentUserPubkey, refreshing]);
  
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
    refreshProfile,
    
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
