
import { useFollowingFeed } from "@/hooks/useFollowingFeed";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import FollowingFeedEmpty from "./following/FollowingFeedEmpty";
import FollowingFeedLoading from "./following/FollowingFeedLoading";
import FollowingFeedContent from "./following/FollowingFeedContent";

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

  const {
    loadMoreRef,
    loading: scrollLoading,
    setLoading,
    hasMore: scrollHasMore,
    setHasMore
  } = useInfiniteScroll(loadMoreEvents, { initialLoad: true });

  // Show empty state when no events and not loading
  if (events.length === 0 && !loading) {
    return (
      <FollowingFeedEmpty 
        activeHashtag={activeHashtag} 
        hasFollowing={following.length > 0} 
      />
    );
  }

  // Show loading state when initially loading with no events
  if (loading && events.length === 0) {
    return <FollowingFeedLoading activeHashtag={activeHashtag} isInitialLoad={true} />;
  }

  // Show the feed content with events
  return (
    <FollowingFeedContent
      events={events}
      profiles={profiles}
      repostData={repostData}
      loadMoreRef={loadMoreRef}
      loading={loading || scrollLoading}
    />
  );
};

export default FollowingFeed;
