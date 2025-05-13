import { useState, useCallback } from 'react';
import { contentCache } from '@/lib/nostr';
import { toast } from 'sonner';
import { getHexPubkey } from '@/lib/utils/profileUtils';
import { fetchProfileWithRetry, handleProfileCache, createMinimalProfile } from './useProfileFetchRetry';
import { useProfileError } from './useProfileError';
import { ProfileData } from '@/components/you/EditProfileSection';

interface UseProfileFetchOptions {
  onSuccess?: (profileData: ProfileData) => void; // Updated to use the specific ProfileData type
}

export function useProfileFetch(options: UseProfileFetchOptions = {}) {
  const [loading, setLoading] = useState(false);
  const { error, setError, handleError, clearError } = useProfileError();

  const { onSuccess } = options;

  const fetchProfile = useCallback(async (hexPubkey: string) => {
    if (!hexPubkey) {
      return handleError("Invalid profile identifier");
    }

    setLoading(true);
    clearError();

    try {
      console.log("Fetching profile for hex pubkey:", hexPubkey);

      // Check cache first
      const cachedProfile = contentCache.getProfile(hexPubkey);
      if (cachedProfile) {
        console.log("Found cached profile:", cachedProfile.name || cachedProfile.display_name || hexPubkey);

        if (onSuccess) {
          onSuccess(cachedProfile);
        }

        setLoading(false);
        return cachedProfile;
      }

      try {
        const profileMetadata = await fetchProfileWithRetry(hexPubkey);

        if (profileMetadata) {
          console.log("Profile fetched successfully:", profileMetadata);
          const processedProfile = handleProfileCache(hexPubkey, profileMetadata);

          if (onSuccess) {
            onSuccess(processedProfile);
          }

          setLoading(false);
          return processedProfile;
        } else {
          console.warn("No profile data returned for pubkey:", hexPubkey);
          setLoading(false);
          return null;
        }
      } catch (connectionError) {
        console.error("Error connecting to relays:", connectionError);

        // If we have cached data, we can still show it
        if (cachedProfile) {
          console.log("Using cached profile data due to connection error");

          if (onSuccess) {
            onSuccess(cachedProfile);
          }

          setLoading(false);
          return cachedProfile;
        } else {
          // Create minimal profile data
          const minimalData = createMinimalProfile(hexPubkey);

          if (onSuccess) {
            onSuccess(minimalData);
          }

          toast.error("Could not connect to relays");
          setLoading(false);
          return minimalData;
        }
      }
    } catch (error) {
      console.error("Error fetching profile metadata:", error);
      return handleError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [onSuccess, handleError, clearError]);

  const fetchProfileFromIdentifier = useCallback(async (identifier: string | undefined) => {
    if (!identifier) return null;

    const hexPubkey = getHexPubkey(identifier);
    if (!hexPubkey) {
      toast.error("Invalid profile identifier");
      setError("Invalid profile identifier");
      return null;
    }

    return fetchProfile(hexPubkey);
  }, [fetchProfile, setError]);

  return {
    fetchProfile,
    fetchProfileFromIdentifier,
    loading,
    error,
    setError
  };
}
