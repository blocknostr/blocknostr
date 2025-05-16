
import React, { useRef, useEffect } from "react";
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
  const feedContainerRef = useRef<HTMLDivElement>(null);
  const prevEventsLength = useRef<number>(events.length);
  
  // Create early loading trigger
  const earlyTriggerRef = useRef<HTMLDivElement | null>(null);
  
  // Effect for early loading
  useEffect(() => {
    if (hasMore && !loadMoreLoading && onLoadMore) {
      const earlyTriggerObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some(entry => entry.isIntersecting) && hasMore && !loadMoreLoading && onLoadMore) {
            onLoadMore();
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px 1500px 0px' }
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
      
      {/* Early loading trigger */}
      {events.length > 5 && (
        <div 
          ref={earlyTriggerRef}
          className="h-0 w-full" 
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
