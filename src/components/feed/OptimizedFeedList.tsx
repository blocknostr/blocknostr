import React, { useRef, useEffect, useState, useLayoutEffect } from "react";
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
  const [prevEventsLength, setPrevEventsLength] = useState(events.length);
  const containerRef = useRef<HTMLDivElement>(null);
  const [estimatedHeight, setEstimatedHeight] = useState(0);
  const [isInitialMount, setIsInitialMount] = useState(true);
  const heightMeasurements = useRef<Record<string, number>>({});
  
  // Keep track of scroll position
  const scrollPositionRef = useRef(0);
  const documentHeightRef = useRef(0);
  
  // Add early loading triggers at multiple points in the feed
  const earlyTriggerRefs = useRef<Array<HTMLDivElement | null>>([]);
  
  // Calculate average post height after render for better estimations
  useLayoutEffect(() => {
    if (events.length > 0 && containerRef.current) {
      const postElements = containerRef.current.querySelectorAll('.post-card');
      let totalHeight = 0;
      let measuredCount = 0;
      
      postElements.forEach((element, index) => {
        const height = element.getBoundingClientRect().height;
        if (height > 0) {
          const id = events[index]?.id || `post-${index}`;
          heightMeasurements.current[id] = height;
          totalHeight += height;
          measuredCount++;
        }
      });
      
      if (measuredCount > 0) {
        const avgHeight = totalHeight / measuredCount;
        // Update estimated height for unmeasured posts
        const unmeasuredCount = events.length - Object.keys(heightMeasurements.current).length;
        setEstimatedHeight(prevHeight => {
          const newEstimate = avgHeight * 1.1; // Add 10% buffer
          return prevHeight === 0 ? newEstimate : (prevHeight * 0.7 + newEstimate * 0.3);
        });
      }
    }
  }, [events]);
  
  // Save scroll position before loading more content
  useEffect(() => {
    const handleScroll = () => {
      scrollPositionRef.current = window.scrollY;
      documentHeightRef.current = document.body.scrollHeight;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Restore scroll position after content changes
  useEffect(() => {
    if (!isInitialMount && events.length > prevEventsLength && prevEventsLength > 0) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        const newDocumentHeight = document.body.scrollHeight;
        const heightDifference = newDocumentHeight - documentHeightRef.current;
        
        if (heightDifference > 0 && scrollPositionRef.current > 0) {
          window.scrollTo({
            top: scrollPositionRef.current + heightDifference,
            behavior: 'auto' // Use 'auto' for immediate position restoration
          });
          
          // Debug log
          console.log("[OptimizedFeedList] Restored scroll position:", {
            before: scrollPositionRef.current,
            after: scrollPositionRef.current + heightDifference,
            heightDiff: heightDifference
          });
        }
      });
    }
    
    if (isInitialMount) {
      setIsInitialMount(false);
    }
    
    // Update previous events length for optimization
    setPrevEventsLength(events.length);
  }, [events.length, prevEventsLength, isInitialMount]);
  
  // Set up early loading triggers
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

  // Calculate the placeholder heights for new posts
  const getPlaceholderHeight = (eventId: string) => {
    return heightMeasurements.current[eventId] || estimatedHeight || 320; // Default fallback
  };
  
  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Render all events as note cards */}
      {events.map((event, index) => (
        <React.Fragment key={event.id}>
          <div 
            className="post-card transition-all duration-300"
            style={{ 
              minHeight: `${getPlaceholderHeight(event.id)}px`,
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
