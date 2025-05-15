import React, { useRef, useEffect, useState, useMemo } from "react";
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
  const [visibleRangeStart, setVisibleRangeStart] = useState(0);
  const [visibleRangeEnd, setVisibleRangeEnd] = useState(10); // Start with first 10 posts
  
  // Create intersection observers to track visible posts
  useEffect(() => {
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const index = parseInt(entry.target.getAttribute('data-index') || '0');
          if (entry.isIntersecting) {
            // Update visible range when post comes into view
            setVisibleRangeStart(prev => Math.min(prev, index));
            setVisibleRangeEnd(prev => Math.max(prev, index + 10)); // Prefetch 10 posts ahead
          }
        });
      },
      { threshold: 0.1 }
    );
    
    // Observe post elements
    document.querySelectorAll('[data-post-visibility]').forEach(el => {
      visibilityObserver.observe(el);
    });
    
    return () => {
      visibilityObserver.disconnect();
    };
  }, [events.length]);
  
  // Setup early loading triggers with higher threshold and larger margin
  useEffect(() => {
    if (hasMore && !loadMoreLoading && onLoadMore) {
      const earlyTriggerObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some(entry => entry.isIntersecting) && hasMore && !loadMoreLoading) {
            console.log("[OptimizedFeedList] Early loading triggered");
            onLoadMore();
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px 2500px 0px' } // Increased bottom margin for earlier detection
      );
      
      if (earlyTriggerRef.current) {
        earlyTriggerObserver.observe(earlyTriggerRef.current);
      }
      
      return () => {
        earlyTriggerObserver.disconnect();
      };
    }
  }, [events.length, hasMore, loadMoreLoading, onLoadMore]);
  
  // Determine which profiles we need to actually keep in memory
  const visibleProfiles = React.useMemo(() => {
    const neededPubkeys = new Set<string>();
    
    // Get pubkeys from visible range
    const visibleEvents = events.slice(visibleRangeStart, visibleRangeEnd + 10);
    
    visibleEvents.forEach(event => {
      if (event.pubkey) {
        neededPubkeys.add(event.pubkey);
      }
      
      // Also include reposters
      if (event.id && repostData[event.id]?.pubkey) {
        neededPubkeys.add(repostData[event.id].pubkey);
      }
    });
    
    // Create filtered profiles object
    const filtered: Record<string, any> = {};
    neededPubkeys.forEach(pubkey => {
      if (profiles[pubkey]) {
        filtered[pubkey] = profiles[pubkey];
      }
    });
    
    return filtered;
  }, [events, profiles, repostData, visibleRangeStart, visibleRangeEnd]);
  
  return (
    <div className="space-y-4">
      {/* Render events as note cards */}
      {events.map((event, index) => (
        <div 
          key={event.id} 
          data-post-visibility 
          data-index={index}
        >
          <NoteCard 
            event={event} 
            profileData={event.pubkey ? visibleProfiles[event.pubkey] : undefined}
            repostData={event.id && repostData[event.id] ? {
              reposterPubkey: repostData[event.id].pubkey,
              reposterProfile: repostData[event.id].pubkey ? visibleProfiles[repostData[event.id].pubkey] : undefined
            } : undefined}
          />
        </div>
      ))}
      
      {/* Early loading trigger at 50% of the feed */}
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

export default React.memo(OptimizedFeedList);
