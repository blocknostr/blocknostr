
import React, { useCallback } from "react";
import { NostrEvent } from "@/lib/nostr";
import NoteCard from "../note/MemoizedNoteCard"; // Use our new memoized component
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useInView } from "../shared/useInView"; // We'll create this hook
import FeedLoadingSkeleton from "./FeedLoadingSkeleton"; // We'll create this component

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
  // Use our custom hook for intersection observer
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.5,
    triggerOnce: false
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
            className="flex items-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Refresh Feed
          </Button>
        </div>
      )}
      
      {/* Staggered rendering for improved perceived performance */}
      <div className="space-y-4">
        {events.map((event, index) => (
          <React.Fragment key={event.id || index}>
            {/* Add staggered animation delay based on index */}
            <div 
              className="animate-fade-in" 
              style={{ 
                animationDelay: `${Math.min(index * 50, 500)}ms`,
                animationFillMode: 'both'
              }}
            >
              <NoteCard 
                event={event} 
                profileData={event.pubkey ? profiles[event.pubkey] : undefined}
                repostData={event.id && repostData[event.id] ? {
                  reposterPubkey: repostData[event.id].pubkey,
                  reposterProfile: repostData[event.id].pubkey ? profiles[repostData[event.id].pubkey] : undefined
                } : undefined}
              />
            </div>
          </React.Fragment>
        ))}
        
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
    </div>
  );
};

export default OptimizedFeedList;
