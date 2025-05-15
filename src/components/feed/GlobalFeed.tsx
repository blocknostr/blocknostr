import React, { useCallback, useState, useEffect } from "react";
import FeedLoading from "./FeedLoading";
import FeedList from "./FeedList";
import { useGlobalFeed } from "./hooks/use-global-feed";
import { Button } from "../ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import FeedLoadingSkeleton from "./FeedLoadingSkeleton";

interface GlobalFeedProps {
  activeHashtag?: string;
}

const GlobalFeed: React.FC<GlobalFeedProps> = ({ activeHashtag }) => {
  const {
    events,
    profiles,
    repostData,
    loadMoreRef,
    loading,
    hasMore,
    loadMoreEvents,
    loadingMore,
    earlyEventsLoaded,
    cacheHit
  } = useGlobalFeed({ activeHashtag });
  
  const [extendedLoading, setExtendedLoading] = useState(true);
  const [showRetry, setShowRetry] = useState(false);
  
  // Reset extended loading state when activeHashtag changes with shorter timeout
  useEffect(() => {
    setExtendedLoading(true);
    setShowRetry(false);
    
    // Set a shorter timeout for showing retry button (3.5s instead of 7s)
    const timeout = setTimeout(() => {
      setExtendedLoading(false);
      if (events.length === 0 && !loading) {
        setShowRetry(true);
      }
    }, 3500); // Reduced from 7s to 3.5s for faster feedback
    
    return () => clearTimeout(timeout);
  }, [activeHashtag, loading]);
  
  // Update showRetry when events or loading state changes
  useEffect(() => {
    if (!extendedLoading && events.length === 0 && !loading) {
      setShowRetry(true);
    } else if (events.length > 0 || loading) {
      setShowRetry(false);
    }
  }, [events, loading, extendedLoading]);
  
  // Clear extended loading when we have some events to show (eager rendering)
  useEffect(() => {
    if (events.length > 0 && extendedLoading) {
      // Show content as soon as we have some events
      setExtendedLoading(false);
    }
  }, [events.length, extendedLoading]);
  
  const handleRetry = () => {
    setExtendedLoading(true);
    setShowRetry(false);
    
    // Force component to re-evaluate its logic
    const event = new CustomEvent('refetch-global-feed');
    window.dispatchEvent(event);
    
    // Set timeout to show retry again if still no events after 3.5 seconds
    setTimeout(() => {
      setExtendedLoading(false);
    }, 3500); // Reduced from 7s to 3.5s
  };

  // Show partial content immediately when available, but still loading more
  if (events.length > 0) {
    return (
      <>
        {/* Show partial feed with loading indicator at top if still in extended loading */}
        {extendedLoading && (
          <div className="mb-4">
            <div className="flex justify-center items-center py-2 text-sm text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
              Loading more posts...
            </div>
          </div>
        )}
        
        {/* Show events list - now we always show partial results when available */}
        <FeedList 
          events={events}
          profiles={profiles}
          repostData={repostData}
          loadMoreRef={loadMoreRef}
          loading={loading}
          onLoadMore={loadMoreEvents}
          hasMore={hasMore}
          loadMoreLoading={loadingMore}
        />
      </>
    );
  }
  
  // Show loading state when no events and loading or in extended loading period
  if (loading || extendedLoading) {
    return <FeedLoading activeHashtag={activeHashtag} />;
  }
  
  // Show retry button when no events and not loading, after extended loading period
  if (events.length === 0 && showRetry) {
    return (
      <div className="py-8 text-center flex flex-col items-center">
        <div className="mb-3">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
        </div>
        <p className="text-muted-foreground mb-4">
          {activeHashtag ? 
            `No posts found with #${activeHashtag} hashtag` :
            "No posts found. Connect to more relays to see posts here."
          }
        </p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRetry}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }
  
  // Show empty state when no events and not loading
  if (events.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        {activeHashtag ? 
          `No posts found with #${activeHashtag} hashtag` :
          "No posts found. Connect to more relays to see posts here."
        }
      </div>
    );
  }

  // This is a fallback, but should not be reached
  return null;
};

export default GlobalFeed;
