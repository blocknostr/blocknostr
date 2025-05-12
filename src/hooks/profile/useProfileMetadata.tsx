import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { getHexPubkey, isCurrentUserProfile } from '@/lib/utils/profileUtils';
import { useRetry } from '@/hooks/useRetry';
import { useProfileFetch } from './useProfileFetch';

interface UseProfileMetadataProps {
  npub: string | undefined;
  currentUserPubkey: string | null;
}

export function useProfileMetadata({ npub, currentUserPubkey }: UseProfileMetadataProps) {
  const [profileData, setProfileData] = useState<any | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  
  // Use our custom hooks
  const { resetRetry, scheduleRetry, canRetry } = useRetry({ maxRetries: 3 });
  const { fetchProfileFromIdentifier, loading, error, setError } = useProfileFetch({
    onSuccess: (data) => {
      if (mountedRef.current) {
        setProfileData(data);
      }
    }
  });
  
  // Convert npub to hex for comparison
  const hexNpub = getHexPubkey(npub);
  const isCurrentUser = isCurrentUserProfile(npub, currentUserPubkey);
  
  // Keep track of component mounting state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);
  
  // Main effect to load profile data
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Reset retry counter when pubkey changes
    resetRetry();
    
    const loadProfileData = async () => {
      if (!npub && !currentUserPubkey) return;
      
      try {
        // Try to fetch profile data
        const pubkeyToFetch = npub || currentUserPubkey;
        
        const fetchedProfile = await fetchProfileFromIdentifier(pubkeyToFetch);
        
        // If no profile found, try to retry
        if (!fetchedProfile && canRetry()) {
          timeoutRef.current = scheduleRetry(loadProfileData);
        } else if (!fetchedProfile && !profileData) {
          // If no profile found after max retries, set minimal data
          const minimalData = {
            pubkey: hexNpub || currentUserPubkey,
            created_at: Math.floor(Date.now() / 1000)
          };
          
          if (mountedRef.current) {
            setProfileData(minimalData);
            console.log("Using minimal profile data after max retries");
          }
        }
      } catch (error) {
        console.error("Error in loadProfileData:", error);
      }
    };
    
    loadProfileData();
    
    // Set a timeout to ensure loading state doesn't hang indefinitely
    timeoutRef.current = window.setTimeout(() => {
      if (mountedRef.current && loading) {
        console.log("Profile metadata loading timeout");
        
        if (!profileData) {
          setError("Profile loading timed out");
          toast.error("Profile loading timed out. Please try again.");
        }
      }
    }, 15000);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [npub, currentUserPubkey, fetchProfileFromIdentifier, loading, resetRetry, scheduleRetry, canRetry, profileData, hexNpub, setError]);

  // Handle refetch functionality
  const refetch = () => {
    if (mountedRef.current) {
      resetRetry(); // Reset retry counter on manual refresh
      
      // Force a refetch by triggering a custom event
      const event = new CustomEvent('refetchProfile', { 
        detail: { npub, currentUserPubkey } 
      });
      window.dispatchEvent(event);
    }
  };

  return {
    profileData,
    loading,
    isCurrentUser,
    hexNpub,
    error,
    refetch
  };
}
