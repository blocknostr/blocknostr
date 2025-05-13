
import React, { useEffect } from "react";
import FeedEmptyState from "./feed/FeedEmptyState";
import FeedLoading from "./feed/FeedLoading";
import FeedList from "./feed/FeedList";
import { useFollowingFeed } from "./feed/useFollowingFeed";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HistoryIcon, RefreshCcwIcon } from "lucide-react";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";
import { useProfileFetcher } from "./feed/hooks/use-profile-fetcher";

interface FollowingFeedProps {
  activeHashtag?: string;
}

const FollowingFeed: React.FC<FollowingFeedProps> = ({ activeHashtag }) => {
  const {
    events,
    repostData,
    loadMoreRef,
    loading,
    following,
    refreshFeed,
    lastUpdated,
    cacheHit,
    loadingFromCache,
  } = useFollowingFeed({ activeHashtag });
  
  // Use our enhanced profile fetcher
  const { profiles, fetchMultipleProfiles } = useProfileFetcher();
  
  // Fetch profiles for authors when events load or change
  useEffect(() => {
    if (events.length > 0) {
      // Collect all pubkeys that need profiles
      const pubkeysToFetch = new Set<string>();
      
      // Add authors of posts
      events.forEach(event => {
        pubkeysToFetch.add(event.pubkey);
      });
      
      // Add reposters
      Object.values(repostData || {}).forEach(data => {
        if (data.reposterPubkey) {
          pubkeysToFetch.add(data.reposterPubkey);
        }
      });
      
      // Fetch profiles in batch
      fetchMultipleProfiles(Array.from(pubkeysToFetch));
    }
  }, [events, repostData, fetchMultipleProfiles]);

  return (
    <>
      {/* Show cache status if we're showing cached content */}
      {cacheHit && lastUpdated && (
        <Alert variant="default" className="mb-4 bg-primary/10 border-primary/20">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <HistoryIcon className="h-4 w-4 text-primary" />
              <AlertDescription>
                Showing cached content from {formatDistanceToNow(lastUpdated, { addSuffix: true })}
              </AlertDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshFeed}
              className="text-xs h-8"
            >
              <RefreshCcwIcon className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          </div>
        </Alert>
      )}
      
      {/* Show loading state when no events and loading */}
      {(loading || loadingFromCache) && events.length === 0 && (
        <FeedLoading activeHashtag={activeHashtag} />
      )}
      
      {/* Show empty state when no events and not loading */}
      {events.length === 0 && !loading && !loadingFromCache && (
        <FeedEmptyState following={following} loading={loading} activeHashtag={activeHashtag} />
      )}

      {/* Show events list */}
      {events.length > 0 && (
        <FeedList 
          events={events}
          profiles={profiles}
          repostData={repostData}
          loadMoreRef={loadMoreRef}
          loading={loading}
          onRefresh={refreshFeed}
        />
      )}
    </>
  );
};

export default FollowingFeed;
