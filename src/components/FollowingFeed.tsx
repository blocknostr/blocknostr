
import React from "react";
import FeedEmptyState from "./feed/FeedEmptyState";
import FeedLoading from "./feed/FeedLoading";
import FeedList from "./feed/FeedList";
import { useFollowingFeed } from "./feed/useFollowingFeed";
import { ConnectionStatusBanner } from "./feed/ConnectionStatusBanner";

interface FollowingFeedProps {
  activeHashtag?: string;
}

const FollowingFeed: React.FC<FollowingFeedProps> = ({ activeHashtag }) => {
  const {
    events,
    profiles,
    repostData,
    loadMoreRef,
    loading,
    following,
  } = useFollowingFeed({ activeHashtag });

  return (
    <>
      <ConnectionStatusBanner />
      
      {/* Show loading state when no events and loading */}
      {loading && events.length === 0 && (
        <FeedLoading activeHashtag={activeHashtag} />
      )}
      
      {/* Show empty state when no events and not loading */}
      {events.length === 0 && !loading && (
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
        />
      )}
    </>
  );
};

export default FollowingFeed;
