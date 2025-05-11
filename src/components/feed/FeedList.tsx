
import React from "react";
import { NostrEvent } from "@/lib/nostr";
import NoteCard from "../NoteCard";

interface FeedListProps {
  events: NostrEvent[];
  profiles: Record<string, any>;
  repostData: Record<string, { pubkey: string, original: NostrEvent }>;
  loadMoreRef: React.RefObject<HTMLDivElement> | ((node: HTMLDivElement | null) => void);
  loading: boolean;
}

const FeedList: React.FC<FeedListProps> = ({
  events,
  profiles,
  repostData,
  loadMoreRef,
  loading
}) => {
  return (
    <div className="space-y-2">
      {/* Standard list rendering with reduced spacing */}
      <div>
        {events.map(event => (
          <div key={event.id} className="border-b border-border/40 last:border-0 hover:bg-accent/5 transition-colors">
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
        
        {/* Loading indicator at the bottom */}
        <div ref={loadMoreRef as React.RefObject<HTMLDivElement>} className="py-3 text-center">
          {loading && events.length > 0 && (
            <div className="text-muted-foreground text-xs">
              Loading more posts...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedList;
