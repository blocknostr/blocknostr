
import { useFollowingFeed } from "@/hooks/useFollowingFeed";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import FollowingFeedEmpty from "./following/FollowingFeedEmpty";
import FollowingFeedLoading from "./following/FollowingFeedLoading";
import FollowingFeedContent from "./following/FollowingFeedContent";
import { useState } from "react";

interface FollowingFeedProps {
  activeHashtag?: string;
}

const FollowingFeed = ({ activeHashtag }: FollowingFeedProps) => {
  const {
    events,
    profiles,
    repostData,
    loading,
    hasMore,
    loadMoreEvents,
    following
  } = useFollowingFeed({ activeHashtag });

  const [filteredEvents, setFilteredEvents] = useState(events);

  // Update filtered events when events change
  React.useEffect(() => {
    setFilteredEvents(events);
  }, [events]);

  const {
    loadMoreRef,
    loading: scrollLoading,
    setLoading,
    hasMore: scrollHasMore,
    setHasMore
  } = useInfiniteScroll(loadMoreEvents, { initialLoad: true });

  const handleRetweetStatusChange = (eventId: string, isRetweeted: boolean) => {
    if (!isRetweeted) {
      // Filter out the unreposted event
      setFilteredEvents(prev => prev.filter(event => event.id !== eventId));
    }
  };

  // Show empty state when no events and not loading
  if (filteredEvents.length === 0 && !loading) {
    return (
      <FollowingFeedEmpty 
        activeHashtag={activeHashtag} 
        hasFollowing={following.length > 0} 
      />
    );
  }

  // Show loading state when initially loading with no events
  if (loading && filteredEvents.length === 0) {
    return <FollowingFeedLoading activeHashtag={activeHashtag} isInitialLoad={true} />;
  }

  // Show the feed content with events
  return (
    <FollowingFeedContent
      events={filteredEvents}
      profiles={profiles}
      repostData={repostData}
      loadMoreRef={loadMoreRef}
      loading={loading || scrollLoading}
      onRetweetStatusChange={handleRetweetStatusChange}
    />
  );
};

export default FollowingFeed;
