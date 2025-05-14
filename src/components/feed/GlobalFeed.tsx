
import React, { useCallback } from "react";
import FeedLoading from "./FeedLoading";
import FeedList from "./FeedList";
import { useGlobalFeed } from "./hooks/use-global-feed";

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
    minLoadingTimeMet,
    refreshFeed
  } = useGlobalFeed({ activeHashtag });

  // Show loading state when no events and loading
  // Make sure we've given enough time to load events before showing empty state
  if ((loading || !minLoadingTimeMet) && events.length === 0) {
    return <FeedLoading activeHashtag={activeHashtag} />;
  }
  
  // Show empty state when no events and not loading
  if (events.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        {activeHashtag ? 
          `No posts found with #${activeHashtag} hashtag` :
          "No posts found. Try refreshing or check your relay connections."
        }
      </div>
    );
  }

  // Show events list
  return (
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
  );
};

export default GlobalFeed;
