
import React from "react";
import FeedEmptyState from "./FeedEmptyState";
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
    recordInteraction
  } = useForYouFeed({ activeHashtag });

  // Record view interactions for displayed events
  React.useEffect(() => {
    if (events.length > 0) {
      // Record view interaction for the first 5 visible posts only
      events.slice(0, 5).forEach(event => {
        recordInteraction('view', event);
      });
    }
  }, [events]);

  // Show loading state when no events and loading
  if (loading && events.length === 0) {
    return <FeedLoading activeHashtag={activeHashtag} />;
  }
  
  // Show empty state when no events and not loading
  if (events.length === 0) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        {activeHashtag ? 
          `No posts found with #${activeHashtag} hashtag in your personalized feed` :
          "Keep interacting with posts to improve your personalized feed"
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
    />
  );
};

export default ForYouFeed;
