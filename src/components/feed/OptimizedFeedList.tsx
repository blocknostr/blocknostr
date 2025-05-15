
import React, { useRef, useEffect } from "react";
import { NostrEvent } from "@/lib/nostr";
import NoteCard from "@/components/note/NoteCard";
import { Loader2 } from "lucide-react";

interface OptimizedFeedListProps {
  events: NostrEvent[];
  profiles: Record<string, any>;
  repostData: Record<string, { pubkey: string, original: NostrEvent }>;
  loadMoreRef?: React.RefObject<HTMLDivElement>;
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadMoreLoading?: boolean;
}

const OptimizedFeedList: React.FC<OptimizedFeedListProps> = ({
  events,
  profiles,
  repostData,
  loadMoreRef,
  loading = false,
  onLoadMore,
  hasMore = true,
  loadMoreLoading = false
}) => {
  const earlyTriggerRef = useRef<HTMLDivElement | null>(null);
  const veryEarlyTriggerRef = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    // Setup early loading triggers with higher threshold and larger margin
    if (hasMore && !loadMoreLoading && onLoadMore) {
      // Very early trigger (super aggressive, when about 4-5 posts from bottom)
      const veryEarlyTriggerObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some(entry => entry.isIntersecting) && hasMore && !loadMoreLoading && onLoadMore) {
            console.log("[OptimizedFeedList] Very early loading triggered");
            onLoadMore();
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px 2500px 0px' } // Much larger bottom margin for even earlier detection
      );
      
      // Regular early trigger (when about 2-3 posts from bottom)
      const earlyTriggerObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some(entry => entry.isIntersecting) && hasMore && !loadMoreLoading && onLoadMore) {
            console.log("[OptimizedFeedList] Early loading triggered");
            onLoadMore();
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px 1500px 0px' } // Large bottom margin for earlier detection
      );
      
      if (veryEarlyTriggerRef.current) {
        veryEarlyTriggerObserver.observe(veryEarlyTriggerRef.current);
      }
      
      if (earlyTriggerRef.current) {
        earlyTriggerObserver.observe(earlyTriggerRef.current);
      }
      
      return () => {
        veryEarlyTriggerObserver.disconnect();
        earlyTriggerObserver.disconnect();
      };
    }
  }, [events.length, hasMore, loadMoreLoading, onLoadMore]);

  // Implement weighted event rendering for prioritized display
  const prioritizedEvents = events.slice(0); // Create a copy before potentially sorting
  
  // Prioritize events with media for better visual engagement (iris.to-like behavior)
  if (prioritizedEvents.length > 10) {
    const hasMediaContent = (event: NostrEvent) => 
      event.tags?.some(tag => tag[0] === 'image' || tag[0] === 'media' || 
        (tag[0] === 'r' && /\.(jpg|jpeg|png|gif|webp|mp4)$/i.test(tag[1])));
      
    // Move some media posts higher in the feed if they're not already at the top
    const mediaEvents = prioritizedEvents.filter(hasMediaContent);
    if (mediaEvents.length > 3) {
      // Pull a couple media posts from later in the feed to the front
      for (let i = Math.min(10, prioritizedEvents.length - 1); i >= 5; i--) {
        if (hasMediaContent(prioritizedEvents[i]) && !hasMediaContent(prioritizedEvents[i-4])) {
          // Swap positions to bring media content forward
          const temp = prioritizedEvents[i];
          prioritizedEvents[i] = prioritizedEvents[i-4];
          prioritizedEvents[i-4] = temp;
        }
      }
    }
  }
  
  return (
    <div className="space-y-4">
      {/* Render events as note cards */}
      {prioritizedEvents.map((event, index) => (
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
      
      {/* Very early loading trigger at 25% of the feed */}
      {events.length > 15 && (
        <div 
          ref={veryEarlyTriggerRef}
          className="h-0 w-full" /* Invisible trigger element */
          aria-hidden="true"
        />
      )}
      
      {/* Early loading trigger at 50% of the feed */}
      {events.length > 8 && (
        <div 
          ref={earlyTriggerRef}
          className="h-0 w-full" /* Invisible trigger element */
          aria-hidden="true"
        />
      )}
      
      {/* Auto-loading indicator */}
      {hasMore && (
        <div className="py-4 text-center" ref={loadMoreRef}>
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
