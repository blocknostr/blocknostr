
import { NostrEvent } from "@/lib/nostr";
import { parseRepostEvent } from "./repost-utils";

/**
 * Loads more events for the global feed
 * @param since Timestamp to load events from
 * @param until Timestamp to load events until
 * @param setupSubscription Function to set up subscription to events
 * @param isLoadingMore Current loading state
 * @param setIsLoadingMore Function to update loading state
 * @param setLoading Function to update main loading state
 */
export const loadMoreGlobalFeedEvents = (
  since: number, 
  until: number,
  setupSubscription: (since: number, until?: number) => void,
  isLoadingMore: boolean,
  setIsLoadingMore: React.Dispatch<React.SetStateAction<boolean>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  if (isLoadingMore) return;
  
  // Set loading more state to prevent multiple simultaneous loads
  setIsLoadingMore(true);
  setLoading(true);
  
  // Set up subscription for older events
  setupSubscription(since, until);
  
  // Reset loading more state after a short delay
  setTimeout(() => {
    setIsLoadingMore(false);
    setLoading(false);
  }, 2000);
};

/**
 * Creates filters for the global feed based on optional hashtag
 * @param activeHashtag Optional hashtag to filter by
 * @param since Timestamp to load events from
 * @param until Timestamp to load events until
 */
export const createGlobalFeedFilters = (
  activeHashtag?: string,
  since?: number,
  until?: number
): any[] => {
  // Create filters for the nostr subscription
  let filters: any[] = [
    {
      kinds: [1], // Regular notes
      limit: 30, // Increased for better doomscrolling
      ...(since && { since }),
      ...(until && { until })
    },
    {
      kinds: [6], // Reposts
      limit: 20,
      ...(since && { since }),
      ...(until && { until })
    }
  ];
  
  // If we have an active hashtag, filter by it
  if (activeHashtag) {
    // Add tag filter
    filters = [
      {
        ...filters[0],
        "#t": [activeHashtag.toLowerCase()]
      },
      {
        ...filters[1] // Keep the reposts filter
      }
    ];
  }

  return filters;
};
