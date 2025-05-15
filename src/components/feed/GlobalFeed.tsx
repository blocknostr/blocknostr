
import React, { useCallback, useState, useEffect } from "react";
import FeedLoading from "./FeedLoading";
import FeedList from "./FeedList";
import { useGlobalFeed } from "./hooks/use-global-feed";
import { Button } from "../ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { TrendingHashtagsBar } from "../trending";

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
    eagerEvents,
    partialLoaded
  } = useGlobalFeed({ activeHashtag });
  
  const [extendedLoading, setExtendedLoading] = useState(true);
  const [showRetry, setShowRetry] = useState(false);
  
  // Reset extended loading state when activeHashtag changes - reduced from 7s to 3s
  useEffect(() => {
    setExtendedLoading(true);
    setShowRetry(false);
    
    // Set a shorter timeout for showing retry button (3s instead of 7s)
    const timeout = setTimeout(() => {
      setExtendedLoading(false);
      if (events.length === 0 && !loading) {
        setShowRetry(true);
      }
    }, 3000); // 3 seconds timeout before showing retry (reduced from 7s)
    
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
  
  const handleRetry = () => {
    setExtendedLoading(true);
    setShowRetry(false);
    
    // Force component to re-evaluate its logic
    const event = new CustomEvent('refetch-global-feed');
    window.dispatchEvent(event);
    
    // Set shorter timeout to show retry again if still no events after 3 seconds
    setTimeout(() => {
      setExtendedLoading(false);
    }, 3000);
  };

  // Show trending hashtags at the top
  const renderTrendingHashtags = () => (
    <div className="mb-4 bg-background/80 backdrop-blur-sm rounded-lg">
      <TrendingHashtagsBar />
    </div>
  );

  // Show partial content (eager loading) when available
  if (eagerEvents?.length > 0 && loading && events.length === 0) {
    return (
      <>
        {renderTrendingHashtags()}
        <div className="space-y-4">
          <FeedList 
            events={eagerEvents}
            profiles={profiles}
            repostData={repostData}
            loadMoreRef={loadMoreRef}
            loading={loading}
            onLoadMore={loadMoreEvents}
            hasMore={hasMore}
            loadMoreLoading={loadingMore}
            isEagerLoading={true}
          />
        </div>
      </>
    );
  }

  // Show loading state when no events and loading or in extended loading period
  if ((loading || extendedLoading) && events.length === 0) {
    return (
      <>
        {renderTrendingHashtags()}
        <FeedLoading activeHashtag={activeHashtag} />
      </>
    );
  }
  
  // Show retry button when no events and not loading, after extended loading period
  if (events.length === 0 && showRetry) {
    return (
      <>
        {renderTrendingHashtags()}
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
      </>
    );
  }
  
  // Show empty state when no events and not loading
  if (events.length === 0) {
    return (
      <>
        {renderTrendingHashtags()}
        <div className="py-8 text-center text-muted-foreground">
          {activeHashtag ? 
            `No posts found with #${activeHashtag} hashtag` :
            "No posts found. Connect to more relays to see posts here."
          }
        </div>
      </>
    );
  }

  // Show events list
  return (
    <>
      {renderTrendingHashtags()}
      <FeedList 
        events={events}
        profiles={profiles}
        repostData={repostData}
        loadMoreRef={loadMoreRef}
        loading={loading}
        onLoadMore={loadMoreEvents}
        hasMore={hasMore}
        loadMoreLoading={loadingMore}
        partialLoaded={partialLoaded}
      />
    </>
  );
};

export default GlobalFeed;
