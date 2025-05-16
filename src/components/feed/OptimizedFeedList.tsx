
import React, { useRef, useCallback, useState, useEffect } from "react";
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
  const [loadingTriggered, setLoadingTriggered] = useState(false);
  const throttleTimerRef = useRef<number | null>(null);
  
  // Use the useInView hook with a more reasonable rootMargin
  const { ref: loadMoreRef, inView } = useInView({
    rootMargin: '0px 0px 600px 0px', // Reduced from 2000px to 600px for more controlled loading
    threshold: 0.1,
  });
  
  // Use callback with throttling for loadMore logic
  const handleLoadMoreVisible = useCallback(() => {
    if (inView && hasMore && !loadMoreLoading && onLoadMore && !loadingTriggered) {
      // Set loading state to prevent multiple rapid triggers
      setLoadingTriggered(true);
      
      // Clear any existing timer
      if (throttleTimerRef.current) {
        window.clearTimeout(throttleTimerRef.current);
      }
      
      // Throttle the load more calls with a slight delay
      throttleTimerRef.current = window.setTimeout(() => {
        console.log("Trigger load more from InView (throttled)", new Date().toISOString());
        onLoadMore();
        
        // Reset the loading trigger after a reasonable cooldown period
        throttleTimerRef.current = window.setTimeout(() => {
          setLoadingTriggered(false);
          throttleTimerRef.current = null;
        }, 2000); // 2 second cooldown before allowing another trigger
      }, 200); // Small delay before triggering load
    }
  }, [inView, hasMore, loadMoreLoading, onLoadMore, loadingTriggered]);
  
  // Effect to trigger load more when inView changes
  useEffect(() => {
    handleLoadMoreVisible();
    
    // Cleanup function to clear any timers when component unmounts
    return () => {
      if (throttleTimerRef.current) {
        window.clearTimeout(throttleTimerRef.current);
      }
    };
  }, [inView, handleLoadMoreVisible]);
  
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
      
      {/* Invisible load more trigger that uses useInView for reliable detection */}
      {events.length > 0 && hasMore && (
        <div 
          ref={loadMoreRef}
          className="h-10 w-full" 
          aria-hidden="true"
          data-testid="load-more-trigger"
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
