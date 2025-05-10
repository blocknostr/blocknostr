
import React from 'react';
import { NostrEvent } from '@/lib/nostr';
import NoteCard from '../NoteCard';

interface GlobalFeedContentProps {
  events: NostrEvent[];
  profiles: Record<string, any>;
  repostData: Record<string, { pubkey: string, original: NostrEvent }>;
  loadMoreRef: React.RefCallback<HTMLDivElement>;
  loading: boolean;
  onRetweetStatusChange?: (eventId: string, isRetweeted: boolean) => void;
}

const GlobalFeedContent: React.FC<GlobalFeedContentProps> = ({
  events,
  profiles,
  repostData,
  loadMoreRef,
  loading,
  onRetweetStatusChange
}) => {
  if (events.length === 0 && !loading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No posts found. Connect to more relays or follow more people.
      </div>
    );
  }

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
          onRetweetStatusChange={onRetweetStatusChange}
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

export default GlobalFeedContent;
