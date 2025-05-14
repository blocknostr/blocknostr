
import React, { useCallback, useEffect } from "react";
import FeedLoading from "./FeedLoading";
import FeedList from "./FeedList";
import { useGlobalFeed } from "./hooks/use-global-feed";
import { NostrEvent } from "@/lib/nostr";

interface FeedState {
  scrollPosition: number;
  events: NostrEvent[];
  profiles: Record<string, any>;
  repostData: Record<string, { pubkey: string, original: NostrEvent }>;
  hasMore: boolean;
  initialLoadComplete: boolean;
}

interface GlobalFeedProps {
  activeHashtag?: string;
  feedState: FeedState;
  onFeedStateChange: (state: Partial<FeedState>) => void;
}

const GlobalFeed: React.FC<GlobalFeedProps> = ({ activeHashtag, feedState, onFeedStateChange }) => {
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
    setEvents,
    setProfiles,
    setRepostData
  } = useGlobalFeed({ 
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
  }, [events, profiles, repostData, hasMore]);

  // Restore state from feedState if we have cached data
  useEffect(() => {
    // Only restore if we have events and the current events array is empty
    if (feedState.events.length > 0 && events.length === 0) {
      setEvents(feedState.events);
      setProfiles(feedState.profiles);
      setRepostData(feedState.repostData);
    }
  }, []);

  // Show loading state when no events and loading
  // Make sure we've given enough time to load events before showing empty state
  if ((loading || !minLoadingTimeMet) && events.length === 0 && !feedState.initialLoadComplete) {
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
      onLoadMore={loadMoreEvents}
      hasMore={hasMore}
      loadMoreLoading={loadingMore}
    />
  );
};

export default GlobalFeed;
