
import React, { useRef, useEffect } from "react";
import { NostrEvent } from "@/lib/nostr";
import NoteCard from "@/components/note/NoteCard";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";

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
  
  return (
    <div className="space-y-4">
      {/* Refresh button - only shows if onRefresh function is provided */}
      {onRefresh && (
        <div className="flex justify-center py-2">
          <Button 
            variant="outline" 
            onClick={onRefresh}
            size="sm"
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh Feed
          </Button>
        </div>
      )}
      
      {/* Render all events as note cards */}
      {events.map((event) => (
        <React.Fragment key={event.id}>
          <NoteCard 
            event={event} 
            profileData={event.pubkey ? profiles[event.pubkey] : undefined}
            repostData={event.id && repostData[event.id] ? {
              reposterPubkey: repostData[event.id].pubkey,
              reposterProfile: repostData[event.id].pubkey ? profiles[repostData[event.id].pubkey] : undefined
            } : undefined}
          />
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
