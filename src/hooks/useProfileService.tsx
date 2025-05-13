
import { useProfileCore } from './profile/useProfileCore';

interface UseProfileServiceProps {
  npub: string | undefined;
  currentUserPubkey: string | null;
}

/**
 * Main profile service hook that provides profile data and operations
 */
export function useProfileService({ npub, currentUserPubkey }: UseProfileServiceProps) {
  try {
    // Delegate to the core implementation with proper error handling
    return useProfileCore({ npub, currentUserPubkey });
  } catch (error) {
    console.error("Error in useProfileService:", error);
    // Return default values in case of error
    return {
      profileData: {
        metadata: {},
        posts: [],
        media: [],
        followers: [],
        following: [],
        relays: [],
        isCurrentUser: true,
      },
      loading: false,
      error: error,
      refreshing: false,
      refreshProfile: () => console.error("Unable to refresh profile due to initialization error")
    };
  }
}
