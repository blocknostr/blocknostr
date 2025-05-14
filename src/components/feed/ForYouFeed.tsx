
import React, { useEffect } from "react";
import FeedEmptyState from "./FeedEmptyState";
import FeedLoading from "./FeedLoading";
import FeedList from "./FeedList";
import { useForYouFeed } from "./hooks/use-for-you-feed";
import { NostrEvent } from "@/lib/nostr";

interface FeedState {
  scrollPosition: number;
  events: NostrEvent[];
  profiles: Record<string, any>;
  repostData: Record<string, { pubkey: string, original: NostrEvent }>;
  hasMore: boolean;
  initialLoadComplete: boolean;
}

interface ForYouFeedProps {
  activeHashtag?: string;
  feedState: FeedState;
  onFeedStateChange: (state: Partial<FeedState>) => void;
}

const ForYouFeed: React.FC<ForYouFeedProps> = ({ 
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
    recordInteraction,
    hasMore,
    loadMoreEvents,
    loadingMore,
    minLoadingTimeMet,
    setEvents,
    setProfiles,
    setRepostData
  } = useForYouFeed({ 
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
  }, [events, profiles, repostData, hasMore, onFeedStateChange]);

  // Restore state from feedState if we have cached data
  useEffect(() => {
    if (feedState.events.length > 0 && events.length === 0) {
      setEvents(feedState.events);
      setProfiles(feedState.profiles);
      setRepostData(feedState.repostData);
    }
  }, [feedState, events.length]);

  // Record view interactions for displayed events
  React.useEffect(() => {
    if (events.length > 0) {
      // Record view interaction for the first 5 visible posts only
      events.slice(0, 5).forEach(event => {
        recordInteraction('view', event);
      });
    }
  }, [events, recordInteraction]);

  // Show loading state when no events and loading or minimum loading time not met yet
  if ((loading || !minLoadingTimeMet) && events.length === 0 && !feedState.initialLoadComplete) {
    return <FeedLoading />;
  }
  
  // Show empty state when no events and not loading
  if (events.length === 0 && !feedState.initialLoadComplete) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        {activeHashtag ? 
          `No posts found with #${activeHashtag} hashtag in your personalized feed` :
          "We couldn't find any posts for your personalized feed. Try interacting with more content to improve recommendations."
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
