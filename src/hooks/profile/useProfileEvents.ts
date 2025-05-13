
import { useEffect, useRef } from 'react';
import { profileDataService } from '@/lib/services/ProfileDataService';
import { useProfileStore } from '@/lib/stores/profileStore';

/**
 * Hook for handling profile data update events from the ProfileDataService
 */
export function useProfileEvents(pubkey: string | null) {
  const isMounted = useRef(true);
  const setRefreshing = useProfileStore(state => state.setRefreshing);
  
  useEffect(() => {
    isMounted.current = true;
    
    const handleMetadataUpdated = (eventPubkey: string, metadata: any) => {
      if (!isMounted.current || eventPubkey !== pubkey) return;
      
      useProfileStore.setState(state => ({
        profileData: state.profileData ? {
          ...state.profileData,
          metadata
        } : null
      }));
    };
    
    const handlePostsUpdated = (eventPubkey: string, posts: any[]) => {
      if (!isMounted.current || eventPubkey !== pubkey) return;
      
      useProfileStore.setState(state => ({
        profileData: state.profileData ? {
          ...state.profileData,
          posts
        } : null
      }));
    };
    
    const handleMediaUpdated = (eventPubkey: string, media: any[]) => {
      if (!isMounted.current || eventPubkey !== pubkey) return;
      
      useProfileStore.setState(state => ({
        profileData: state.profileData ? {
          ...state.profileData,
          media
        } : null
      }));
    };
    
    const handleRelationsUpdated = (eventPubkey: string, relations: { followers: any[], following: any[] }) => {
      if (!isMounted.current || eventPubkey !== pubkey) return;
      
      useProfileStore.setState(state => ({
        profileData: state.profileData ? { 
          ...state.profileData, 
          followers: relations.followers,
          following: relations.following
        } : null
      }));
    };
    
    const handleRelaysUpdated = (eventPubkey: string, relays: any[]) => {
      if (!isMounted.current || eventPubkey !== pubkey) return;
      
      useProfileStore.setState(state => ({
        profileData: state.profileData ? { 
          ...state.profileData, 
          relays 
        } : null
      }));
    };
    
    const handleReactionsUpdated = (eventPubkey: string, data: { 
      reactions: any[], 
      referencedEvents: Record<string, any> 
    }) => {
      if (!isMounted.current || eventPubkey !== pubkey) return;
      
      useProfileStore.setState(state => ({
        profileData: state.profileData ? { 
          ...state.profileData, 
          reactions: data.reactions,
          referencedEvents: data.referencedEvents
        } : null
      }));
    };
    
    const handleLoadingStateChanged = (eventPubkey: string, loadingState: any) => {
      if (!isMounted.current || eventPubkey !== pubkey) return;
      
      // Update loading state in store
      useProfileStore.setState(state => ({
        loadingStates: {
          ...state.loadingStates,
          [eventPubkey]: loadingState
        }
      }));
      
      // Metadata is most critical for UI
      if (loadingState.metadata === 'success') {
        useProfileStore.setState({ loading: false });
        setRefreshing(false);
      } else if (loadingState.metadata === 'error') {
        if (loadingState.posts === 'error') {
          useProfileStore.setState({ 
            error: 'Failed to load profile data',
            loading: false
          });
          setRefreshing(false);
        }
      }
    };
    
    // Register all event handlers
    profileDataService.on('metadata-updated', handleMetadataUpdated);
    profileDataService.on('posts-updated', handlePostsUpdated);
    profileDataService.on('media-updated', handleMediaUpdated);
    profileDataService.on('relations-updated', handleRelationsUpdated);
    profileDataService.on('relays-updated', handleRelaysUpdated);
    profileDataService.on('reactions-updated', handleReactionsUpdated);
    profileDataService.on('loading-state-changed', handleLoadingStateChanged);
    
    // Clean up event listeners on unmount
    return () => {
      isMounted.current = false;
      profileDataService.off('metadata-updated', handleMetadataUpdated);
      profileDataService.off('posts-updated', handlePostsUpdated);
      profileDataService.off('media-updated', handleMediaUpdated);
      profileDataService.off('relations-updated', handleRelationsUpdated);
      profileDataService.off('relays-updated', handleRelaysUpdated);
      profileDataService.off('reactions-updated', handleReactionsUpdated);
      profileDataService.off('loading-state-changed', handleLoadingStateChanged);
    };
  }, [pubkey, setRefreshing]);
}
