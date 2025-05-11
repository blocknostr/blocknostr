
import React, { useEffect, useRef } from "react";
import { NostrEvent } from "@/lib/nostr";
import NoteCard from "../NoteCard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface FeedListProps {
  events: NostrEvent[];
  profiles: Record<string, any>;
  repostData: Record<string, { pubkey: string, original: NostrEvent }>;
  loadMoreRef: React.RefObject<HTMLDivElement> | ((node: HTMLDivElement | null) => void);
  loading: boolean;
  onRefresh?: () => void;
}

const FeedList: React.FC<FeedListProps> = ({
  events,
  profiles,
  repostData,
  loadMoreRef,
  loading,
  onRefresh
}) => {
  // Use a ref to track if this is the initial render
  const isInitialRender = useRef(true);
  const prevEventsLength = useRef(events.length);
  
  // This effect prevents scrolling on initial render or when events are refreshed
  useEffect(() => {
    if (isInitialRender.current) {
      // First render - scroll to top
      window.scrollTo(0, 0);
      isInitialRender.current = false;
      return;
    }
    
    // If the number of events decreased (indicating a refresh), scroll to top
    if (events.length < prevEventsLength.current) {
      window.scrollTo(0, 0);
    }
    
    prevEventsLength.current = events.length;
  }, [events]);

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
      
      {/* Standard list rendering */}
      <div className="space-y-4">
        {events.map(event => (
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
        
        {/* Loading indicator at the bottom */}
        <div ref={loadMoreRef as React.RefObject<HTMLDivElement>} className="py-4 text-center">
          {loading && events.length > 0 && (
            <div className="text-muted-foreground text-sm">
              Loading more posts...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedList;
