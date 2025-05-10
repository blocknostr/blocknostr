
import React from "react";
import FeedEmptyState from "./feed/FeedEmptyState";
import FeedLoading from "./feed/FeedLoading";
import FeedList from "./feed/FeedList";
import { useFollowingFeed } from "./feed/useFollowingFeed";

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

  // Show loading state when no events and loading
  if (loading && events.length === 0) {
    return <FeedLoading activeHashtag={activeHashtag} />;
  }
  
  // Show empty state when no events and not loading
  if (events.length === 0) {
    return <FeedEmptyState following={following} loading={loading} activeHashtag={activeHashtag} />;
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

export default FollowingFeed;
