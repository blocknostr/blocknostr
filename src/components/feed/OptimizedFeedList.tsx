
import React, { useRef, useCallback, useEffect } from "react";
import { NostrEvent } from "@/lib/nostr";
import NoteCard from "@/components/note/NoteCard";
import { Loader2 } from "lucide-react";
import { useInView } from "@/components/shared/useInView";

interface OptimizedFeedListProps {
  events: NostrEvent[];
  profiles: Record<string, any>;
  repostData: Record<string, { pubkey: string, original: NostrEvent }>;
  loading?: boolean;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadMoreLoading?: boolean;
}

const OptimizedFeedList: React.FC<OptimizedFeedListProps> = ({
  events,
  profiles,
  repostData,
  loading = false,
  onRefresh,
  onLoadMore,
  hasMore = true,
  loadMoreLoading = false
}) => {
  const feedContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreCalledRef = useRef(false);
  
  // CRITICAL FIX: Use an extremely aggressive rootMargin to ensure we load more content
  // well before the user reaches the bottom (similar to iris.to's approach)
  const { ref: loadMoreRef, inView } = useInView({
    rootMargin: '0px 0px 6000px 0px', // Dramatically increased from 4000px to 6000px
    threshold: 0.01, // Very low threshold to trigger earlier
  });
  
  // Use callback for loadMore logic to prevent unnecessary rerenders
  const handleLoadMoreVisible = useCallback(() => {
    if (inView && hasMore && !loadMoreLoading && onLoadMore && !loadMoreCalledRef.current) {
      console.log("[OptimizedFeedList] InView triggered load more, hasMore:", hasMore, "loadMoreLoading:", loadMoreLoading);
      loadMoreCalledRef.current = true;
      onLoadMore();
      
      // Reset the flag after a delay to allow loading more again
      setTimeout(() => {
        loadMoreCalledRef.current = false;
      }, 5000); // 5 second cooldown to prevent rapid firing
    }
  }, [inView, hasMore, loadMoreLoading, onLoadMore]);
  
  // Effect to trigger load more when inView changes
  useEffect(() => {
    handleLoadMoreVisible();
  }, [inView, handleLoadMoreVisible]);
  
  // Debug log when events change
  useEffect(() => {
    console.log("[OptimizedFeedList] Events count:", events.length, "HasMore:", hasMore);
  }, [events.length, hasMore]);
  
  return (
    <div className="space-y-4" ref={feedContainerRef}>
      {/* Render events as note cards */}
      {events.map((event) => (
        <NoteCard 
          key={event.id} 
          event={event} 
          profileData={event.pubkey ? profiles[event.pubkey] : undefined}
          repostData={event.id && repostData[event.id] ? {
            reposterPubkey: repostData[event.id].pubkey,
            reposterProfile: repostData[event.id].pubkey ? profiles[repostData[event.id].pubkey] : undefined
          } : undefined}
        />
      ))}
      
      {/* CRITICAL FIX: Always render the load more trigger with improved visibility */}
      {hasMore && (
        <div 
          ref={loadMoreRef}
          className="h-40 w-full flex items-center justify-center" // Increased height for better visibility
          aria-hidden="true"
          data-testid="load-more-trigger"
          id="load-more-trigger"
        />
      )}
      
      {/* Auto-loading indicator */}
      {hasMore && (
        <div className="py-4 text-center">
          {loadMoreLoading && (
            <div className="flex items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading more posts...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OptimizedFeedList;
