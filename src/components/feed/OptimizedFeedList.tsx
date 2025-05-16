
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
  const [isIOS, setIsIOS] = useState(false);
  
  // Create more aggressive early loading triggers
  const earlyTriggerRef = useRef<HTMLDivElement | null>(null);

  // Detect if on iOS device
  useEffect(() => {
    const detectIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(detectIOS);
  }, []);
  
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
        { 
          threshold: 0.1, 
          rootMargin: isIOS ? '0px 0px 1000px 0px' : '0px 0px 2000px 0px' // Smaller margin for iOS
        } 
      );
      
      if (earlyTriggerRef.current) {
        earlyTriggerObserver.observe(earlyTriggerRef.current);
      }
      
      return () => {
        earlyTriggerObserver.disconnect();
      };
    }
  }, [events.length, hasMore, loadMoreLoading, onLoadMore, isIOS]);
  
  return (
    <div className="space-y-4 w-full">
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
