
import React from "react";
import NoteCard from "@/components/NoteCard";

interface LikesTabProps {
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  loadingProfiles: boolean;
  displayedReactions: any[];
  referencedEvents: Record<string, any>;
  profiles: Record<string, any>;
  loadMoreRef: (node: HTMLDivElement | null) => void;
}

const LikesTab: React.FC<LikesTabProps> = ({
  loading,
  loadingMore,
  hasMore,
  loadingProfiles,
  displayedReactions,
  referencedEvents,
  profiles,
  loadMoreRef
}) => {
  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <span className="text-sm text-muted-foreground">Loading likes...</span>
        </div>
      ) : displayedReactions.length === 0 ? (
        <div className="py-4 text-center">
          <p className="text-muted-foreground">No likes found.</p>
        </div>
      ) : (
        <>
          {displayedReactions.map((reaction) => {
            // Find the original post that was liked
            const eventId = reaction.tags?.find(
              (tag: string[]) => tag[0] === "e"
            )?.[1];
            const referencedEvent = eventId ? referencedEvents[eventId] : null;
            
            // Only show if we have the referenced event
            if (!referencedEvent) return null;
            
            return (
              <NoteCard
                key={reaction.id}
                event={referencedEvent}
                profileData={referencedEvent.pubkey ? profiles[referencedEvent.pubkey] : undefined}
              />
            );
          })}
        </>
      )}

      <div ref={loadMoreRef} className="py-2 text-center">
        {loadMoreLoading ? (
          <div className="flex items-center justify-center py-4">
            <span className="text-sm text-muted-foreground">Loading more likes...</span>
          </div>
        ) : (
          <div className="h-8">{/* Spacer for intersection observer */}</div>
        )}
      </div>
    </div>
  );
};

export default LikesTab;
