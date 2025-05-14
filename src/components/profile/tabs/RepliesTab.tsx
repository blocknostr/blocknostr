
import React from "react";
import NoteCard from "@/components/NoteCard";
import { NostrEvent } from "@/lib/nostr";
import { Loader2 } from "lucide-react";

interface RepliesTabProps {
  loading: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  displayedReplies: NostrEvent[];
  profileData: any;
  loadMoreRef?: (node: HTMLDivElement | null) => void;
}

export const RepliesTab: React.FC<RepliesTabProps> = ({ 
  loading, 
  loadingMore = false,
  hasMore = false,
  displayedReplies, 
  profileData,
  loadMoreRef
}) => {
  if (loading && (!displayedReplies || displayedReplies.length === 0)) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading replies...</span>
      </div>
    );
  }

  if (!displayedReplies || displayedReplies.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No replies found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayedReplies.map(event => (
        <NoteCard 
          key={event.id} 
          event={event} 
          profileData={profileData || undefined}
          isReply={true}
        />
      ))}
      
      {/* Infinite scroll loader */}
      {hasMore && (
        <div 
          ref={loadMoreRef} 
          className="py-4 flex justify-center"
        >
          {loadingMore ? (
            <div className="flex items-center">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Loading more replies...</span>
            </div>
          ) : (
            <div className="h-8" /> /* Spacer for intersection observer */
          )}
        </div>
      )}
    </div>
  );
};
