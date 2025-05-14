
import React, { useEffect } from "react";
import FeedEmptyState from "./feed/FeedEmptyState";
import FeedLoading from "./feed/FeedLoading";
import FeedList from "./feed/FeedList";
import { useFollowingFeed } from "./feed/useFollowingFeed";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HistoryIcon, RefreshCcwIcon } from "lucide-react";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";
import { NostrEvent } from "@/lib/nostr";

interface FeedState {
  scrollPosition: number;
  events: NostrEvent[];
  profiles: Record<string, any>;
  repostData: Record<string, { pubkey: string, original: NostrEvent }>;
  hasMore: boolean;
  initialLoadComplete: boolean;
}

interface FollowingFeedProps {
  activeHashtag?: string;
  feedState: FeedState;
  onFeedStateChange: (state: Partial<FeedState>) => void;
}

const FollowingFeed: React.FC<FollowingFeedProps> = ({ 
  activeHashtag, 
  feedState,
  onFeedStateChange
}) => {
  const {
    events,
    profiles,
    repostData,
    loadMoreRef,
    loading,
    following,
    refreshFeed,
    lastUpdated,
    cacheHit,
    loadingFromCache,
    loadingMore,
    hasMore,
    loadMoreEvents,
    isRetrying,
    setEvents,
    setProfiles,
    setRepostData
  } = useFollowingFeed({ 
    activeHashtag,
    initialEvents: feedState.events,
    initialProfiles: feedState.profiles,
    initialRepostData: feedState.repostData,
    initialHasMore: feedState.hasMore
  });

  // Update parent component with the latest feed state
  useEffect(() => {
    onFeedStateChange({ 
      events, 
      profiles, 
      repostData, 
      hasMore,
      initialLoadComplete: true
    });
  }, [events, profiles, repostData, hasMore]);

  // Restore state from feedState if we have cached data
  useEffect(() => {
    if (feedState.events.length > 0 && events.length === 0) {
      setEvents(feedState.events);
      setProfiles(feedState.profiles);
      setRepostData(feedState.repostData);
    }
  }, []);

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
      {(loading || loadingFromCache) && events.length === 0 && !feedState.initialLoadComplete && (
        <FeedLoading activeHashtag={activeHashtag} />
      )}
      
      {/* Show empty state when no events and not loading */}
      {events.length === 0 && !loading && !loadingFromCache && !isRetrying && !feedState.initialLoadComplete && (
        <FeedEmptyState following={following} loading={loading} activeHashtag={activeHashtag} />
      )}

      {/* Show events list with auto-loading functionality */}
      {(events.length > 0 || feedState.initialLoadComplete) && (
        <FeedList 
          events={events}
          profiles={profiles}
          repostData={repostData}
          loadMoreRef={loadMoreRef}
          loading={loading}
          onRefresh={refreshFeed}
          onLoadMore={loadMoreEvents}
          hasMore={hasMore}
          loadMoreLoading={loadingMore}
        />
      )}
    </>
  );
};

export default FollowingFeed;
