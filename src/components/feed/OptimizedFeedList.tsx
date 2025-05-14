
import React, { useCallback, useEffect, useState } from "react";
import { NostrEvent } from "@/lib/nostr";
import NoteCard from "../note/MemoizedNoteCard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useInView } from "../shared/useInView";
import FeedLoadingSkeleton from "./FeedLoadingSkeleton";
import { useUnifiedProfileFetcher } from "@/hooks/useUnifiedProfileFetcher";

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

const INITIAL_DISPLAY_COUNT = 15;

const OptimizedFeedList: React.FC<OptimizedFeedListProps> = ({
  events,
  profiles: initialProfiles,
  repostData,
  loading,
  onRefresh,
  onLoadMore,
  hasMore,
  loadMoreLoading = false
}) => {
  // State to track how many posts to display
  const [visibleCount, setVisibleCount] = useState(INITIAL_DISPLAY_COUNT);
  
  // Use our custom hook for intersection observer
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.5,
    triggerOnce: false
  });

  // Use our unified profile fetcher with enhanced features
  const { profiles: unifiedProfiles, fetchProfiles, isLoading: profilesLoading } = useUnifiedProfileFetcher();
  
  // Combine initial profiles with unified profiles with unified profiles taking precedence
  const combinedProfiles = { ...initialProfiles, ...unifiedProfiles };
  
  // Fetch profiles for authors that aren't already loaded
  useEffect(() => {
    if (events.length > 0) {
      console.log(`[OptimizedFeedList] Checking profiles for ${events.length} events`);
      
      // Collect all unique pubkeys that need profiles
      const pubkeysToFetch = new Set<string>();
      
      // Add authors
      events.forEach(event => {
        if (event.pubkey && !combinedProfiles[event.pubkey]) {
          pubkeysToFetch.add(event.pubkey);
        }
      });
      
      // Add reposters
      Object.values(repostData).forEach(data => {
        if (data.pubkey && !combinedProfiles[data.pubkey]) {
          pubkeysToFetch.add(data.pubkey);
        }
      });
      
      if (pubkeysToFetch.size > 0) {
        console.log(`[OptimizedFeedList] Fetching ${pubkeysToFetch.size} profiles`);
        fetchProfiles(Array.from(pubkeysToFetch));
      } else {
        console.log('[OptimizedFeedList] All profiles are already loaded');
      }
    }
  }, [events, repostData, fetchProfiles]);
  
  // Log profile coverage stats
  useEffect(() => {
    if (events.length > 0) {
      const totalProfiles = events.length;
      let profilesWithNames = 0;
      
      events.forEach(event => {
        if (event.pubkey && combinedProfiles[event.pubkey] && 
            (combinedProfiles[event.pubkey].name || combinedProfiles[event.pubkey].display_name)) {
          profilesWithNames++;
        }
      });
      
      const coverage = (profilesWithNames / totalProfiles) * 100;
      console.log(`[OptimizedFeedList] Profile coverage: ${profilesWithNames}/${totalProfiles} events (${coverage.toFixed(1)}%)`);
    }
  }, [events, combinedProfiles]);

  // Load more content when the load more element comes into view
  useEffect(() => {
    if (inView && hasMore && !loadMoreLoading && visibleCount >= events.length) {
      console.log('[OptimizedFeedList] Load more triggered by scrolling');
      onLoadMore();
    }
  }, [inView, hasMore, loadMoreLoading, onLoadMore, events.length, visibleCount]);

  // Handler for "Load More" button click
  const handleLoadMoreClick = useCallback(() => {
    // Show more posts in increments
    setVisibleCount(prev => Math.min(prev + INITIAL_DISPLAY_COUNT, events.length));
  }, [events.length]);

  if (loading && events.length === 0) {
    return <FeedLoadingSkeleton count={3} />;
  }

  // Determine if we should show the "Load More" button
  const hasMoreToShow = visibleCount < events.length;
  // Get only the events we want to display
  const visibleEvents = events.slice(0, visibleCount);

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
      
      {/* Feed counter showing visible blocks */}
      {events.length > 0 && (
        <div className="text-sm text-muted-foreground text-center mb-2">
          Showing {visibleCount} Blocks
        </div>
      )}
      
      {/* Staggered rendering for improved perceived performance */}
      <div className="space-y-4">
        {visibleEvents.map((event, index) => (
          <React.Fragment key={event.id || index}>
            {/* Add staggered animation delay based on index */}
            <div 
              className="animate-fade-in" 
              style={{ 
                animationDelay: `${Math.min(index * 50, 500)}ms`,
                animationFillMode: 'both'
              }}
            >
              <NoteCard 
                event={event} 
                profileData={event.pubkey ? combinedProfiles[event.pubkey] : undefined}
                repostData={event.id && repostData[event.id] ? {
                  reposterPubkey: repostData[event.id].pubkey,
                  reposterProfile: repostData[event.id].pubkey ? 
                    combinedProfiles[repostData[event.id].pubkey] : undefined
                } : undefined}
              />
            </div>
          </React.Fragment>
        ))}
        
        {/* "Load More" button */}
        {hasMoreToShow && (
          <div className="flex justify-center py-4">
            <Button
              variant="outline"
              onClick={handleLoadMoreClick}
              className="px-8 py-2"
            >
              Load More
            </Button>
          </div>
        )}
        
        {/* Loading indicator at the bottom that triggers more content from the API */}
        {hasMore && visibleCount >= events.length && (
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
        {!hasMore && visibleCount >= events.length && events.length > 0 && (
          <div className="text-center py-8 text-muted-foreground border-t">
            You've reached the end of your feed
          </div>
        )}
      </div>
    </div>
  );
};

export default OptimizedFeedList;
