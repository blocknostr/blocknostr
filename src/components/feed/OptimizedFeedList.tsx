
import React, { useEffect } from "react";
import { NostrEvent } from "@/lib/nostr";
import { useInView } from "../shared/useInView";
import FeedLoadingSkeleton from "./FeedLoadingSkeleton";
import { useUnifiedProfileFetcher } from "@/hooks/useUnifiedProfileFetcher";
import useFeedPagination from "./hooks/useFeedPagination";

// Import our new component
import FeedItem from "./components/FeedItem";
import FeedCounter from "./components/FeedCounter";
import FeedRefreshButton from "./components/FeedRefreshButton";
import FeedLoadMoreButton from "./components/FeedLoadMoreButton";
import FeedLoadingIndicator from "./components/FeedLoadingIndicator";
import FeedEndMessage from "./components/FeedEndMessage";

interface OptimizedFeedListProps {
  events: NostrEvent[];
  profiles: Record<string, any>;
  repostData: Record<string, { pubkey: string, original: NostrEvent }>;
  loading: boolean;
  onRefresh?: () => void;
  onLoadMore: () => void;
  hasMore: boolean;
  loadMoreLoading?: boolean;
}

const OptimizedFeedList: React.FC<OptimizedFeedListProps> = ({
  events,
  profiles: initialProfiles,
  repostData,
  loading,
  onRefresh,
  onLoadMore,
  hasMore,
  loadMoreLoading = false
}) => {
  // Use our pagination hook
  const { 
    visibleCount, 
    visibleEvents, 
    hasMoreToShow, 
    handleLoadMore 
  } = useFeedPagination({ events });
  
  // Use our custom hook for intersection observer
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.5,
    triggerOnce: false
  });

  // Use our unified profile fetcher with enhanced features
  const { profiles: unifiedProfiles, fetchProfiles, isLoading: profilesLoading } = useUnifiedProfileFetcher();
  
  // Combine initial profiles with unified profiles with unified profiles taking precedence
  const combinedProfiles = { ...initialProfiles, ...unifiedProfiles };
  
  // Fetch profiles for authors that aren't already loaded
  useEffect(() => {
    if (events.length > 0) {
      console.log(`[OptimizedFeedList] Checking profiles for ${events.length} events`);
      
      // Collect all unique pubkeys that need profiles
      const pubkeysToFetch = new Set<string>();
      
      // Add authors
      events.forEach(event => {
        if (event.pubkey && !combinedProfiles[event.pubkey]) {
          pubkeysToFetch.add(event.pubkey);
        }
      });
      
      // Add reposters
      Object.values(repostData).forEach(data => {
        if (data.pubkey && !combinedProfiles[data.pubkey]) {
          pubkeysToFetch.add(data.pubkey);
        }
      });
      
      if (pubkeysToFetch.size > 0) {
        console.log(`[OptimizedFeedList] Fetching ${pubkeysToFetch.size} profiles`);
        fetchProfiles(Array.from(pubkeysToFetch));
      } else {
        console.log('[OptimizedFeedList] All profiles are already loaded');
      }
    }
  }, [events, repostData, fetchProfiles, combinedProfiles]);
  
  // Log profile coverage stats
  useEffect(() => {
    if (events.length > 0) {
      const totalProfiles = events.length;
      let profilesWithNames = 0;
      
      events.forEach(event => {
        if (event.pubkey && combinedProfiles[event.pubkey] && 
            (combinedProfiles[event.pubkey].name || combinedProfiles[event.pubkey].display_name)) {
          profilesWithNames++;
        }
      });
      
      const coverage = (profilesWithNames / totalProfiles) * 100;
      console.log(`[OptimizedFeedList] Profile coverage: ${profilesWithNames}/${totalProfiles} events (${coverage.toFixed(1)}%)`);
    }
  }, [events, combinedProfiles]);

  // Load more content when the load more element comes into view
  useEffect(() => {
    if (inView && hasMore && !loadMoreLoading && visibleCount >= events.length) {
      console.log('[OptimizedFeedList] Load more triggered by scrolling');
      onLoadMore();
    }
  }, [inView, hasMore, loadMoreLoading, onLoadMore, events.length, visibleCount]);

  if (loading && events.length === 0) {
    return <FeedLoadingSkeleton count={3} />;
  }

  return (
    <div className="space-y-4">
      {/* Optional refresh button */}
      <FeedRefreshButton onRefresh={onRefresh} loading={loading} />
      
      {/* Feed counter showing visible blocks */}
      <FeedCounter visibleCount={visibleCount} eventsLength={events.length} />
      
      {/* Staggered rendering for improved perceived performance */}
      <div className="space-y-4">
        {visibleEvents.map((event, index) => (
          <FeedItem 
            key={event.id || index}
            event={event}
            index={index}
            profileData={event.pubkey ? combinedProfiles[event.pubkey] : undefined}
            repostData={event.id && repostData[event.id]}
          />
        ))}
        
        {/* "Load More" button */}
        <FeedLoadMoreButton 
          onClick={handleLoadMore} 
          visible={hasMoreToShow}
        />
        
        {/* Loading indicator at the bottom that triggers more content from the API */}
        <div ref={loadMoreRef}>
          <FeedLoadingIndicator 
            loading={loadMoreLoading} 
            hasMore={hasMore} 
            inView={visibleCount >= events.length}
          />
        </div>
        
        {/* End of feed message */}
        <FeedEndMessage 
          visible={!hasMore && visibleCount >= events.length && events.length > 0}
        />
      </div>
    </div>
  );
};

export default OptimizedFeedList;
