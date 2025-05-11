
import React from "react";
import FeedEmptyState from "./FeedEmptyState";
import FeedLoading from "./FeedLoading";
import FeedList from "./FeedList";
import { useMediaFeed } from "./hooks/use-media-feed";
import { Card } from "@/components/ui/card";

interface MediaFeedProps {
  activeHashtag?: string;
}

const MediaFeed: React.FC<MediaFeedProps> = ({ activeHashtag }) => {
  const {
    events,
    profiles,
    repostData,
    loadMoreRef,
    loading,
    hasMore
  } = useMediaFeed({ activeHashtag });

  // Show loading state when no events and loading
  if (loading && events.length === 0) {
    return <FeedLoading activeHashtag={activeHashtag} mediaOnly={true} />;
  }
  
  // Show empty state when no events and not loading
  if (events.length === 0) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        {activeHashtag ? 
          `No media posts found with #${activeHashtag} hashtag` :
          "No media posts found. Connect to more relays to see media here."
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

export default MediaFeed;
