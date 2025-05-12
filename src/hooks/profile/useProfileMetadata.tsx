import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { getHexPubkey, isCurrentUserProfile } from './utils/pubkeyUtils';
import { useProfileFetch } from './useProfileFetch';

interface UseProfileMetadataProps {
  npub: string | undefined;
  currentUserPubkey: string | null;
}

export function useProfileMetadata({ npub, currentUserPubkey }: UseProfileMetadataProps) {
  const [profileData, setProfileData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  
  // Import the profile fetching hook
  const { fetchProfile, error: fetchError } = useProfileFetch();
  
  // Convert npub to hex
  const hexNpub = getHexPubkey(npub);
  
  // Determine if this is the current user's profile
  const isCurrentUser = isCurrentUserProfile(hexNpub, currentUserPubkey);
  
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
  
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    const loadProfileData = async () => {
      if (!npub && !currentUserPubkey) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Determine which pubkey to use
        let pubkeyToUse = npub;
        
        if (!pubkeyToUse && currentUserPubkey) {
          pubkeyToUse = currentUserPubkey;
        }
        
        if (!pubkeyToUse) {
          toast.error("Invalid profile identifier");
          setError("Invalid profile identifier");
          setLoading(false);
          return;
        }
        
        // Use the fetchProfile function from the useProfileFetch hook
        const profile = await fetchProfile(pubkeyToUse);
        
        // Update state if component is still mounted
        if (mountedRef.current) {
          if (profile) {
            setProfileData(profile);
          } else {
            setError(fetchError || "Failed to load profile");
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Error in useProfileMetadata:", error);
        
        if (mountedRef.current) {
          setError("Failed to load profile");
          toast.error("Could not load profile data. Please try again.");
          setLoading(false);
        }
      }
    };
    
    loadProfileData();
    
    // Set a timeout to ensure loading state doesn't hang indefinitely
    timeoutRef.current = window.setTimeout(() => {
      if (mountedRef.current && loading) {
        console.log("Profile metadata loading timeout");
        setLoading(false);
        
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
  }, [npub, currentUserPubkey, fetchProfile, fetchError, loading, profileData]);

  return {
    profileData,
    loading,
    isCurrentUser,
    hexNpub,
    error,
    refetch: () => {
      if (mountedRef.current) {
        setLoading(true);
        setError(null);
        
        // Force a refetch by triggering a custom event
        const event = new CustomEvent('refetchProfile', { 
          detail: { npub, currentUserPubkey } 
        });
        window.dispatchEvent(event);
      }
    }
  };
}
