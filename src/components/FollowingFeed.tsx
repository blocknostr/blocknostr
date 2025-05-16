
import React, { useEffect } from "react";
import FeedEmptyState from "./feed/FeedEmptyState";
import FeedLoading from "./feed/FeedLoading";
import FeedList from "./feed/FeedList";
import { useFollowingFeed } from "./feed/useFollowingFeed";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HistoryIcon, RefreshCcwIcon } from "lucide-react";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";

interface FollowingFeedProps {
  activeHashtag?: string;
  onLoadingChange?: (isLoading: boolean) => void;
}

const FollowingFeed: React.FC<FollowingFeedProps> = ({ 
  activeHashtag,
  onLoadingChange
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
    isRetrying
  } = useFollowingFeed({ activeHashtag });

  // Notify parent component of loading state changes
  useEffect(() => {
    // Update loading state via callback if provided
    if (onLoadingChange) {
      onLoadingChange(loading || loadingFromCache);
    }
    
    // Dispatch custom event for global notification of loading state changes
    window.dispatchEvent(new CustomEvent('feed-loading-change', { 
      detail: { isLoading: loading || loadingFromCache || isRetrying }
    }));
    
  }, [loading, loadingFromCache, isRetrying, onLoadingChange]);

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
      {events.length === 0 && !loading && !loadingFromCache && !isRetrying && (
        <FeedEmptyState following={following} loading={loading} activeHashtag={activeHashtag} />
      )}

      {/* Show events list with auto-loading functionality */}
      {events.length > 0 && (
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
