
import React from "react";
import { NostrEvent } from "@/lib/nostr";
import NoteCard from "../NoteCard";

interface FeedListProps {
  events: NostrEvent[];
  profiles: Record<string, any>;
  repostData: Record<string, { pubkey: string, original: NostrEvent }>;
  loadMoreRef: React.RefObject<HTMLDivElement>;
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
      <div ref={loadMoreRef} className="py-4 text-center">
        {loading && events.length > 0 && (
          <div className="text-muted-foreground text-sm">
            Loading more posts...
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedList;
