
import React, { useRef } from "react";
import { NostrEvent } from "@/lib/nostr";
import NoteCard from "@/components/NoteCard"; // Use our memoized component
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { useInView } from "../shared/useInView";
import FeedLoadingSkeleton from "./FeedLoadingSkeleton";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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
  profiles,
  repostData,
  loading,
  onRefresh,
  onLoadMore,
  hasMore,
  loadMoreLoading = false
}) => {
  // Use our custom hook for intersection observer (for load more)
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.5,
    triggerOnce: false
  });

  // Reference to the scrollable parent container
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Set up virtualization
  const rowVirtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 250, // Estimated height of each post
    overscan: 5, // Number of items to render beyond visible area
  });

  // Load more content when the load more element comes into view
  React.useEffect(() => {
    if (inView && hasMore && !loadMoreLoading) {
      onLoadMore();
    }
  }, [inView, hasMore, loadMoreLoading, onLoadMore]);

  if (loading && events.length === 0) {
    return <FeedLoadingSkeleton count={3} />;
  }

  return (
    <div className="space-y-4">
      {/* Optional refresh button */}
      {onRefresh && (
        <div className="flex justify-center mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            disabled={loading}
            className={cn(
              "flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/10",
              loading && "opacity-70"
            )}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh Feed
          </Button>
        </div>
      )}
      
      {/* Events list */}
      <div className="space-y-3">
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
      </div>
      
      {/* Loading indicator at the bottom that triggers more content */}
      {hasMore && (
        <div 
          ref={loadMoreRef} 
          className="py-4 text-center"
        >
          {loadMoreLoading && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading more posts...
            </div>
          )}
        </div>
      )}
      
      {/* End of feed message */}
      {!hasMore && events.length > 0 && (
        <div className="text-center py-8 text-muted-foreground border-t">
          You've reached the end of your feed
        </div>
      )}
    </div>
  );
};

export default OptimizedFeedList;
