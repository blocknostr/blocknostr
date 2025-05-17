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

  // Track visible posts for anchoring
  const postRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lastVisiblePostId = useRef<string | null>(null);
  const lastVisiblePostY = useRef<number>(0);
  
  // Detect if on iOS device
  useEffect(() => {
    const detectIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(detectIOS);
  }, []);
  
  // Track which post is most visible in the viewport for anchoring
  useEffect(() => {
    const trackVisiblePosts = () => {
      // Don't track during loading to avoid position jumps
      if (loading || loadMoreLoading) return;
      
      // Find the most visible post
      const viewportHeight = window.innerHeight;
      const scrollY = window.scrollY;
      
      let mostVisiblePost: { id: string, visibility: number } | null = null;
      
      // Check each post's visibility
      Object.entries(postRefs.current).forEach(([id, element]) => {
        if (!element) return;
        
        const rect = element.getBoundingClientRect();
        // Calculate how much of the element is in the viewport (0 to 1)
        const visibleTop = Math.max(0, rect.top);
        const visibleBottom = Math.min(viewportHeight, rect.bottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        const visibility = visibleHeight / rect.height;
        
        if (!mostVisiblePost || visibility > mostVisiblePost.visibility) {
          mostVisiblePost = { id, visibility };
        }
      });
      
      if (mostVisiblePost && mostVisiblePost.visibility > 0.3) {
        // Store the ID and position of the most visible post
        lastVisiblePostId.current = mostVisiblePost.id;
        
        const element = postRefs.current[mostVisiblePost.id];
        if (element) {
          // Store the absolute Y position of the post
          lastVisiblePostY.current = element.getBoundingClientRect().top + scrollY;
        }
      }
    };
    
    // Track visible posts during normal scrolling
    const debouncedTrack = debounce(trackVisiblePosts, 150);
    window.addEventListener('scroll', debouncedTrack, { passive: true });
    
    // Also track when the component first renders
    trackVisiblePosts();
    
    return () => {
      window.removeEventListener('scroll', debouncedTrack);
    };
  }, [events, loading, loadMoreLoading]);
  
  // Restore scroll position when events change
  useEffect(() => {
    // Only attempt restoration if we have a reference post and events have loaded
    if (lastVisiblePostId.current && events.length > 0 && !loading) {
      // Use requestAnimationFrame to ensure the DOM has updated
      requestAnimationFrame(() => {
        // First try to find our anchor post
        const anchorPost = postRefs.current[lastVisiblePostId.current as string];
        
        if (anchorPost) {
          // Calculate where this post is now
          const newY = anchorPost.getBoundingClientRect().top + window.scrollY;
          // Calculate the difference from where it was before
          const yDiff = newY - lastVisiblePostY.current;
          
          // Adjust scroll position to keep the anchor post in the same position
          if (Math.abs(yDiff) > 5) { // Only adjust if the difference is significant
            window.scrollTo({
              top: window.scrollY + yDiff,
              behavior: 'auto' // Use 'auto' instead of 'smooth' to avoid visual jumps
            });
            
            console.log(`[OptimizedFeedList] Restored position using anchor post ${lastVisiblePostId.current}, adjusted by ${yDiff}px`);
          }
        }
      });
    }
  }, [events, loading]);
  
  // Simple debounce function
  function debounce<F extends (...args: any[]) => any>(func: F, wait: number) {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    
    return function(...args: Parameters<F>) {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }
  
  // Set up early loading with debounce to avoid excessive triggers
  useEffect(() => {
    // Setup early loading triggers with higher threshold and larger margin
    if (hasMore && !loadMoreLoading && onLoadMore) {
      const handleScroll = () => {
        if (earlyTriggerRef.current) {
          const rect = earlyTriggerRef.current.getBoundingClientRect();
          const threshold = window.innerHeight + (isIOS ? 1000 : 2000);
          
          if (rect.top < threshold && hasMore && !loadMoreLoading && onLoadMore) {
            console.log("[OptimizedFeedList] Early loading triggered");
            onLoadMore();
          }
        }
      };
      
      // Debounce the scroll handler to prevent rapid firing
      const debouncedScroll = debounce(handleScroll, 150);
      
      window.addEventListener('scroll', debouncedScroll, { passive: true });
      
      // Initial check
      handleScroll();
      
      return () => {
        window.removeEventListener('scroll', debouncedScroll);
      };
    }
  }, [events.length, hasMore, loadMoreLoading, onLoadMore, isIOS]);
  
  return (
    <div className="space-y-5 w-full pt-2" style={{ overscrollBehavior: 'contain' }}>
      {/* Render events as note cards with ref tracking */}
      {events.map((event) => (
        <div 
          key={event.id} 
          ref={(el) => {
            // Store reference to this post element
            if (event.id) {
              postRefs.current[event.id] = el;
            }
          }}
          className="min-h-[80px]" // Minimum height helps with position calculations
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
