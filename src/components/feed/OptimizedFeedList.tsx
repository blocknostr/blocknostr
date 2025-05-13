
import React, { useRef, useMemo } from "react";
import { NostrEvent } from "@/lib/nostr";
import NoteCard from "@/components/NoteCard"; 
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useInView } from "../shared/useInView";
import FeedLoadingSkeleton from "./FeedLoadingSkeleton";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  
  // Keep track of measured sizes
  const sizesCache = useRef<Record<string, number>>({});
  
  // Set up virtualization with dynamic size measurement
  const rowVirtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const event = events[index];
      // Return cached size if available, otherwise use estimations based on content
      if (event.id && sizesCache.current[event.id]) {
        return sizesCache.current[event.id];
      }
      
      // Improved base size estimate - consistent with iris.to approach
      let estimatedSize = 120;
      
      // Add more height for longer content with more precise estimates
      if (event.content) {
        const contentLength = event.content.length;
        if (contentLength < 100) {
          estimatedSize += 20;
        } else if (contentLength < 280) {
          estimatedSize += 40;
        } else {
          estimatedSize += Math.min(60, contentLength / 10);
        }
      }
      
      // Better detection for images with more precise height estimates
      if (event.content?.match(/https?:\/\/\S+\.(jpg|jpeg|png|gif|webp)/i)) {
        estimatedSize += 250; // More accurate height for images
      }
      
      // Add fixed height for hashtags
      if (Array.isArray(event.tags) && event.tags.some(tag => tag[0] === 't')) {
        estimatedSize += 26;
      }
      
      // Add consistent spacing between posts
      return estimatedSize + 8; // 8px for spacing
    },
    overscan: 3, // Reduced overscan for better performance
    measureElement: (element) => {
      // Get the actual rendered height
      const height = element.getBoundingClientRect().height;
      
      // Get the event ID from the data attribute
      const eventId = element.getAttribute('data-event-id');
      
      // Store the measured height in our cache
      if (eventId) {
        sizesCache.current[eventId] = height + 8; // Add consistent 8px spacing
      }
      
      return height + 8; // Return with consistent 8px spacing
    }
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
      
      {/* Virtualized list with ScrollArea */}
      <ScrollArea
        className="h-[calc(100vh-200px)] min-h-[400px]"
      >
        <div 
          ref={parentRef} 
          className="custom-scrollbar"
        >
          {/* Define the container size based on virtualizer */}
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {/* Only render the visible items */}
            {rowVirtualizer.getVirtualItems().map(virtualRow => {
              const event = events[virtualRow.index];
              return (
                <div
                  key={event.id || virtualRow.index}
                  data-event-id={event.id}
                  style={{
                    position: 'absolute',
                    top: `${virtualRow.start}px`,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    padding: '0',
                    marginBottom: '0', // Remove any margin to ensure consistent spacing
                  }}
                >
                  <NoteCard 
                    event={event} 
                    profileData={event.pubkey ? profiles[event.pubkey] : undefined}
                    repostData={event.id && repostData[event.id] ? {
                      reposterPubkey: repostData[event.id].pubkey,
                      reposterProfile: repostData[event.id].pubkey ? profiles[repostData[event.id].pubkey] : undefined
                    } : undefined}
                    feedVariant="virtualized"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
      
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
