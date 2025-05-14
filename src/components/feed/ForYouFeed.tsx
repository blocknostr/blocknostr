
import React, { useEffect } from "react";
import FeedLoading from "./FeedLoading";
import FeedList from "./FeedList";
import { useForYouFeed } from "./hooks/use-for-you-feed";

interface ForYouFeedProps {
  activeHashtag?: string;
}

const ForYouFeed: React.FC<ForYouFeedProps> = ({ activeHashtag }) => {
  const {
    events,
    profiles,
    repostData,
    loadMoreRef,
    loading,
    recordInteraction,
    hasMore,
    loadMoreEvents,
    loadingMore,
    isInitialLoadingTimeout
  } = useForYouFeed({ activeHashtag });

  // Record view interactions for displayed events
  React.useEffect(() => {
    if (events.length > 0) {
      // Record view interaction for the first 5 visible posts only
      events.slice(0, 5).forEach(event => {
        recordInteraction('view', event);
      });
    }
  }, [events, recordInteraction]);

  // Show loading state when no events and loading or during initial loading timeout
  if ((loading || isInitialLoadingTimeout) && events.length === 0) {
    return <FeedLoading activeHashtag={activeHashtag} />;
  }
  
  // Show empty state when no events and not loading
  if (events.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        {activeHashtag ? 
          `No posts found with #${activeHashtag} hashtag in your personalized feed` :
          "No posts in your personalized feed yet. Interact with more posts to improve recommendations."
        }
      </div>
    );
  }

  // Show events list with auto-loading functionality
  return (
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
  );
};

export default ForYouFeed;
