
import React, { useRef, useEffect, useState } from "react";
import { NostrEvent } from "@/lib/nostr";
import NoteCard from "@/components/note/NoteCard";
import { Loader2 } from "lucide-react";

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
  const lastRef = useRef<HTMLDivElement>(null);
  const earlyTriggerRef = useRef<HTMLDivElement | null>(null);
  const prevEventsCountRef = useRef<number>(events.length);
  const [newContentReceived, setNewContentReceived] = useState(false);
  
  // Detect when new content is received
  useEffect(() => {
    if (events.length > prevEventsCountRef.current && !loading) {
      // We received new content
      setNewContentReceived(true);
      
      // Clear the notification after a delay
      const timeout = setTimeout(() => {
        setNewContentReceived(false);
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
    
    prevEventsCountRef.current = events.length;
  }, [events.length, loading]);
  
  // Setup early loading triggers with higher threshold
  useEffect(() => {
    if (hasMore && !loadMoreLoading && onLoadMore) {
      const earlyTriggerObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some(entry => entry.isIntersecting) && hasMore && !loadMoreLoading && onLoadMore) {
            console.log("[OptimizedFeedList] Early loading triggered");
            onLoadMore();
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px 2000px 0px' } // Large bottom margin for earlier detection
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
    <div className="space-y-4 relative">
      {/* New content notification */}
      {newContentReceived && (
        <div className="sticky top-14 z-40 bg-primary text-primary-foreground text-sm py-1 px-3 rounded-md mx-auto w-fit transform animate-fade-in-down">
          New content loaded
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
        <div 
          className="py-4 text-center relative" 
          ref={lastRef}
          style={{ minHeight: loadMoreLoading ? '60px' : '40px' }}
        >
          {loadMoreLoading && (
            <div className="flex items-center justify-center text-sm text-muted-foreground gap-2 absolute left-0 right-0">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading more posts...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OptimizedFeedList;
