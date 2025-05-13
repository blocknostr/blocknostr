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
      let cachedProfile = contentCache.getProfile(hexPubkey);
      if (!cachedProfile) {
        cachedProfile = undefined;
      }
      // Always ensure cachedProfile is a valid ProfileData
      if (cachedProfile && (typeof cachedProfile !== 'object' || !('name' in cachedProfile))) {
        cachedProfile = undefined;
      }
      if (cachedProfile) {
        console.log("Found cached profile:",
          cachedProfile.name || cachedProfile.display_name || "Unknown");

        if (onSuccess) {
          onSuccess(cachedProfile);
        }

        setLoading(false);
        return cachedProfile;
      }

      try {
        const profileMetadata = await fetchProfileWithRetry(hexPubkey);
        // Always ensure we have a valid profile object, even if minimal
        const finalProfile = profileMetadata || createMinimalProfile(hexPubkey);
        // Defensive: if finalProfile is missing required fields, fallback
        if (!finalProfile || typeof finalProfile !== 'object' || !('name' in finalProfile)) {
          console.warn("Fetched profile is invalid, using minimal profile");
          finalProfile = createMinimalProfile(hexPubkey);
        }
        console.log("Profile fetched successfully:", finalProfile.name || "Unknown");
        const processedProfile = handleProfileCache(hexPubkey, finalProfile);

        if (onSuccess) {
          onSuccess(processedProfile);
        }

        setLoading(false);
        return processedProfile;
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
      const minimalProfile = createMinimalProfile(hexPubkey);
      if (onSuccess) {
        onSuccess(minimalProfile);
      }
      setLoading(false);
      return minimalProfile;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, handleError, clearError]);

  const fetchProfileFromIdentifier = useCallback(async (identifier: string | undefined) => {
    if (!identifier) return createMinimalProfile("");

    const hexPubkey = getHexPubkey(identifier);
    if (!hexPubkey) {
      toast.error("Invalid profile identifier");
      setError("Invalid profile identifier");
      return createMinimalProfile("");
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
