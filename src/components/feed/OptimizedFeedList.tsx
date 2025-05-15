
import React, { useRef, useEffect } from "react";
import { NostrEvent } from "@/lib/nostr";
import NoteCard from "@/components/note/NoteCard";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OptimizedFeedListProps {
  events: NostrEvent[];
  profiles: Record<string, any>;
  repostData: Record<string, { pubkey: string, original: NostrEvent }>;
  loading?: boolean;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadMoreLoading?: boolean;
  isEagerLoading?: boolean;
  partialLoaded?: boolean;
}

const OptimizedFeedList: React.FC<OptimizedFeedListProps> = ({
  events,
  profiles,
  repostData,
  loading = false,
  onRefresh,
  onLoadMore,
  hasMore = true,
  loadMoreLoading = false,
  isEagerLoading = false,
  partialLoaded = false
}) => {
  const lastRef = useRef<HTMLDivElement>(null);
  
  // Create more aggressive early loading triggers
  const earlyTriggerRef = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    // Setup early loading triggers with higher threshold and larger margin
    if (hasMore && !loadMoreLoading && onLoadMore) {
      const earlyTriggerObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some(entry => entry.isIntersecting) && hasMore && !loadMoreLoading && onLoadMore) {
            console.log("[OptimizedFeedList] Early loading triggered");
            onLoadMore();
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px 2500px 0px' } // Even larger bottom margin for earlier detection
      );
      
      if (earlyTriggerRef.current) {
        earlyTriggerObserver.observe(earlyTriggerRef.current);
      }
      
      return () => {
        earlyTriggerObserver.disconnect();
      };
    }
  }, [events.length, hasMore, loadMoreLoading, onLoadMore]);
  
  return (
    <div className="space-y-4">
      {/* Eager loading indicator */}
      {isEagerLoading && (
        <div className="flex justify-center mb-2">
          <Badge variant="outline" className="text-xs bg-background animate-pulse">
            Loading initial posts...
          </Badge>
        </div>
      )}
      
      {/* Partial content loaded indicator */}
      {partialLoaded && !isEagerLoading && (
        <div className="flex justify-center mb-2">
          <Badge variant="outline" className="text-xs bg-muted/30">
            Showing recent posts - loading more...
          </Badge>
        </div>
      )}
      
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
      
      {/* Early loading trigger at 75% of the feed */}
      {events.length > 5 && (
        <div 
          ref={earlyTriggerRef}
          className="h-0 w-full" /* Invisible trigger element */
          aria-hidden="true"
        />
      )}
      
      {/* Auto-loading indicator */}
      {hasMore && (
        <div className="py-4 text-center" ref={lastRef}>
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
