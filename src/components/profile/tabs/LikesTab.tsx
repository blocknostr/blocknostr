
import React from "react";
import { NostrEvent } from "@/lib/nostr";
import NoteCard from "@/components/NoteCard";
import { Loader2 } from "lucide-react";

interface LikesTabProps {
  reactions: NostrEvent[];
  referencedEvents: Record<string, NostrEvent>;
  profiles: Record<string, any>;
  isLoading: boolean;
}

const LikesTab: React.FC<LikesTabProps> = ({ 
  reactions, 
  referencedEvents,
  profiles,
  isLoading 
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading likes...</span>
      </div>
    );
  }

  if (!reactions || reactions.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No likes found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reactions.map(reactionEvent => {
        // Safely extract the eventId from tags with null checks
        let eventId = '';
        if (reactionEvent && reactionEvent.tags && Array.isArray(reactionEvent.tags)) {
          const eTag = reactionEvent.tags.find(tag => 
            Array.isArray(tag) && tag.length >= 2 && tag[0] === 'e'
          );
          eventId = eTag ? eTag[1] : '';
        }
        
        if (!eventId) return null;
        
        const originalEvent = referencedEvents[eventId];
        
        if (!originalEvent) {
          return (
            <div key={reactionEvent.id} className="p-4 border rounded-md flex items-center justify-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading liked post...</span>
            </div>
          );
        }
        
        // Get the profile data for the author of the original post
        const originalAuthorProfileData = originalEvent.pubkey && profiles ? profiles[originalEvent.pubkey] : undefined;
        
        return (
          <NoteCard 
            key={reactionEvent.id}
            event={originalEvent}
            profileData={originalAuthorProfileData}
            reactionData={{
              emoji: reactionEvent.content || '+',
              reactionEvent: reactionEvent
            }}
          />
        );
      }).filter(Boolean)}
    </div>
  );
};

export default LikesTab;
