import * as React from "react";
import { nostrService } from "@/lib/nostr";
import { useUserProfile } from "@/hooks/queries/useProfileQueries"; // Import the new hook

export function useSidebarProfile() {
  const currentPubkey = nostrService.publicKey;
  const isLoggedIn = !!currentPubkey;

  // Use the React Query hook to fetch the profile
  // Enable the query only if the user is logged in (currentPubkey is not null)
  const {
    data: profileData,
    isLoading,
    error
  } = useUserProfile(currentPubkey, { enabled: isLoggedIn });

  // Transform the profileData to the structure expected by components using this hook
  const userProfile = React.useMemo(() => {
    if (!profileData) return {};
    // Safely access _event and then created_at, providing a fallback to profileData.created_at if _event is not as expected.
    const createdAt = profileData._event && typeof profileData._event === 'object' && 'created_at' in profileData._event
      ? profileData._event.created_at as number
      : profileData.created_at;
    return {
      name: profileData.name,
      display_name: profileData.display_name,
      picture: profileData.picture,
      nip05: profileData.nip05,
      about: profileData.about,
      created_at: createdAt,
    };
  }, [profileData]);

  if (error) {
    console.error("Failed to fetch user profile for sidebar:", error);
  }

  // The useEffect for fetching and the interval are no longer needed,
  // React Query handles caching, background updates, and refetching.
  // The nostrService.connectToUserRelays() call has been removed as it's
  // a connection concern, not a data-fetching one for this specific hook.

  return { isLoggedIn, userProfile, isLoading };
}
