
import React, { useRef, useCallback } from "react";
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
  
  // Use the useInView hook for more reliable intersection detection
  const { ref: loadMoreRef, inView } = useInView({
    rootMargin: '0px 0px 1500px 0px',
    threshold: 0.1,
  });
  
  // Use callback for loadMore logic to prevent unnecessary rerenders
  const handleLoadMoreVisible = useCallback(() => {
    if (inView && hasMore && !loadMoreLoading && onLoadMore) {
      console.log("Trigger load more from InView");
      onLoadMore();
    }
  }, [inView, hasMore, loadMoreLoading, onLoadMore]);
  
  // Effect to trigger load more when inView changes
  React.useEffect(() => {
    handleLoadMoreVisible();
  }, [inView, handleLoadMoreVisible]);
  
  return (
    <div className="space-y-3" ref={feedContainerRef}>
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
        />
      )}
      
      {/* Auto-loading indicator */}
      {hasMore && (
        <div className="py-3 text-center">
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
