import { useUserProfiles } from '@/hooks/queries/useProfileQueries';
import type { NostrProfileMetadata } from '@/lib/nostr';

interface UseProfileFetcherProps {
  pubkeys?: string[]; // Made pubkeys optional
}

interface UseProfileFetcherReturn {
  profiles: Record<string, NostrProfileMetadata | null | undefined>;
  isLoading: boolean;
}

export const useProfileFetcher = ({
  pubkeys = [], // Default to empty array if not provided
}: UseProfileFetcherProps): UseProfileFetcherReturn => {
  const uniquePubkeys = pubkeys ? [...new Set(pubkeys)].filter(Boolean) : [];

  // The order of results corresponds to the order of uniquePubkeys
  const results = useUserProfiles(uniquePubkeys, {
    // Queries will be enabled if uniquePubkeys has items, and then individually based on each pubkey's validity
    enabled: uniquePubkeys.length > 0,
  });

  let isLoadingOverall = false;
  const profilesMap: Record<string, NostrProfileMetadata | null | undefined> = {}; // Corrected type

  results.forEach((result, index) => {
    const currentPubkey = uniquePubkeys[index]; // Get pubkey by index

    if (result.isLoading) {
      isLoadingOverall = true;
    }

    if (currentPubkey) {
      if (result.isSuccess) {
        // result.data is NostrProfileMetadata | null
        profilesMap[currentPubkey] = result.data;
      } else if (result.isError) {
        profilesMap[currentPubkey] = null; // Explicitly set to null on error
        console.error(
          `[useProfileFetcher] Error fetching profile for ${currentPubkey}:`,
          result.error
        );
      } else if (!result.isLoading) {
        // Query is not loading, not success, not error (e.g., idle/disabled).
        // Ensure it has an entry if we expect one and it hasn't been set.
        if (!(currentPubkey in profilesMap)) {
          profilesMap[currentPubkey] = undefined;
        }
      }
    }
  });

  // Ensure all originally requested uniquePubkeys have an entry in the profilesMap.
  uniquePubkeys.forEach((pubkey) => {
    if (!(pubkey in profilesMap)) {
      // This case handles pubkeys for which queries might not have run or resolved,
      // or if the pubkey was somehow not processed in the loop above.
      profilesMap[pubkey] = undefined;
    }
  });

  return { profiles: profilesMap, isLoading: isLoadingOverall };
};
