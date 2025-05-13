
import React, { useEffect, useRef, useState } from "react";
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
  
  // Track scroll position
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [lastScrollHeight, setLastScrollHeight] = useState(0);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [isScrollPaused, setIsScrollPaused] = useState(false);
  
  // Use our custom hook for intersection observer with reduced sensitivity
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1, // Reduced from 0.5 to be less sensitive
    triggerOnce: false,
    rootMargin: '300px' // Only trigger when closer to the viewport
  });

  // Use our unified profile fetcher with enhanced features
  const { profiles: unifiedProfiles, fetchProfiles, isLoading: profilesLoading } = useUnifiedProfileFetcher();
  
  // Combine initial profiles with unified profiles with unified profiles taking precedence
  const combinedProfiles = { ...initialProfiles, ...unifiedProfiles };
  
  // Save scroll position before updates
  useEffect(() => {
    if (scrollContainerRef.current) {
      setLastScrollHeight(scrollContainerRef.current.scrollHeight);
      setLastScrollTop(scrollContainerRef.current.scrollTop);
    }
  }, [events.length]);
  
  // Restore scroll position after updates
  useEffect(() => {
    if (scrollContainerRef.current && lastScrollHeight > 0) {
      // Calculate height difference
      const newHeight = scrollContainerRef.current.scrollHeight;
      const heightDiff = newHeight - lastScrollHeight;
      
      // Only adjust if we're not at the top of the feed and content was added
      if (lastScrollTop > 0 && heightDiff > 0) {
        scrollContainerRef.current.scrollTop = lastScrollTop + heightDiff;
      }
    }
  }, [visibleEvents.length, lastScrollHeight, lastScrollTop]);
  
  // Batch fetch profiles for better performance
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
  
  // Less aggressive infinite scroll loading
  useEffect(() => {
    if (inView && hasMore && !loadMoreLoading && !isScrollPaused && visibleCount >= events.length) {
      console.log('[OptimizedFeedList] Load more triggered by scrolling');
      onLoadMore();
    }
  }, [inView, hasMore, loadMoreLoading, onLoadMore, events.length, visibleCount, isScrollPaused]);

  // Toggle automatic loading
  const toggleScrollPause = () => {
    setIsScrollPaused(prev => !prev);
  };

  if (loading && events.length === 0) {
    return <FeedLoadingSkeleton count={3} />;
  }

  return (
    <div className="space-y-4" ref={scrollContainerRef}>
      {/* Optional refresh button with pause/resume functionality */}
      <div className="flex justify-between items-center">
        <FeedRefreshButton onRefresh={onRefresh} loading={loading} />
        
        {/* Pause/resume auto-loading button */}
        {events.length > 0 && (
          <button 
            onClick={toggleScrollPause}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              isScrollPaused 
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" 
                : "bg-muted text-muted-foreground"
            }`}
          >
            {isScrollPaused ? "Resume Auto-Loading" : "Pause Auto-Loading"}
          </button>
        )}
      </div>
      
      {/* Feed counter showing visible blocks */}
      <FeedCounter visibleCount={visibleCount} eventsLength={events.length} />
      
      {/* Staggered rendering with reduced animation for improved performance */}
      <div className="space-y-4">
        {visibleEvents.map((event, index) => (
          <div 
            key={event.id || index}
            className="transition-all duration-200 ease-out"
            style={{ 
              animationDelay: `${Math.min(index * 50, 500)}ms` // Cap the delay for better UX
            }}
          >
            <FeedItem 
              event={event}
              index={index}
              profileData={event.pubkey ? combinedProfiles[event.pubkey] : undefined}
              repostData={event.id && repostData[event.id]}
            />
          </div>
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
            hasMore={hasMore && !isScrollPaused} 
            inView={visibleCount >= events.length}
            isPaused={isScrollPaused}
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
