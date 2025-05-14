
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
  
  // Add early loading triggers at multiple points in the feed
  const earlyTriggerRefs = useRef<Array<HTMLDivElement | null>>([]);
  
  useEffect(() => {
    // Set up early loading triggers
    const earlyTriggerObserver = new IntersectionObserver(
      (entries) => {
        // If any early trigger becomes visible and we're not already loading
        if (entries.some(entry => entry.isIntersecting) && hasMore && !loadMoreLoading && onLoadMore) {
          console.log("[OptimizedFeedList] Early loading trigger activated");
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px 1500px 0px' }  // Very large bottom margin for early detection
    );
    
    // Observe early trigger refs
    earlyTriggerRefs.current.forEach(ref => {
      if (ref) earlyTriggerObserver.observe(ref);
    });
    
    return () => {
      earlyTriggerObserver.disconnect();
    };
  }, [events.length, hasMore, loadMoreLoading, onLoadMore]);
  
  useEffect(() => {
    // Check how many profiles we're missing
    const totalEvents = events.length;
    let hasProfileCount = 0;
    
    events.forEach(event => {
      if (event.pubkey && profiles[event.pubkey]) {
        hasProfileCount++;
      }
    });
    
    console.log(`[OptimizedFeedList] Profile coverage: ${hasProfileCount}/${totalEvents} events (${(hasProfileCount/totalEvents*100).toFixed(1)}%)`);
    
    // Prefetch missing profiles
    const missingProfiles = new Set<string>();
    events.forEach(event => {
      if (event.pubkey && !profiles[event.pubkey]) {
        missingProfiles.add(event.pubkey);
      }
    });
    
    if (missingProfiles.size > 0) {
      console.log(`[OptimizedFeedList] Fetching ${missingProfiles.size} profiles`);
    }
  }, [events, profiles]);
  
  // Calculate positions for early triggers
  const earlyTriggerPositions = events.length > 10 ? [
    Math.floor(events.length * 0.5),  // Halfway through the list
    Math.floor(events.length * 0.75), // Three quarters through the list
  ] : [];
  
  return (
    <div className="space-y-4">
      {/* Render all events as note cards */}
      {events.map((event, index) => (
        <React.Fragment key={event.id}>
          <NoteCard 
            event={event} 
            profileData={event.pubkey ? profiles[event.pubkey] : undefined}
            repostData={event.id && repostData[event.id] ? {
              reposterPubkey: repostData[event.id].pubkey,
              reposterProfile: repostData[event.id].pubkey ? profiles[repostData[event.id].pubkey] : undefined
            } : undefined}
          />
          
          {/* Add early loading triggers at specific positions */}
          {earlyTriggerPositions.includes(index) && (
            <div 
              ref={el => earlyTriggerRefs.current[earlyTriggerPositions.indexOf(index)] = el}
              className="h-0 w-full" /* Invisible trigger element */
            />
          )}
        </React.Fragment>
      ))}
      
      {/* Auto-loading indicator - no more button */}
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
