
import React from "react";
import NoteCard from "@/components/NoteCard";
import { NostrEvent } from "@/lib/nostr";

interface UnifiedFeedTabProps {
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  feedItems: NostrEvent[];
  profileData: any;
  loadMoreRef: (node: HTMLDivElement | null) => void;
}

const UnifiedFeedTab: React.FC<UnifiedFeedTabProps> = ({
  loading,
  loadingMore,
  hasMore,
  feedItems,
  profileData,
  loadMoreRef
}) => {
  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <span className="text-sm text-muted-foreground">Loading posts...</span>
        </div>
      ) : feedItems.length === 0 ? (
        <div className="flex items-center justify-center py-4">
          <span className="text-sm text-muted-foreground">No posts found.</span>
        </div>
      ) : (
        <div className="space-y-4">
          {feedItems.map((event) => (
            <NoteCard key={event.id} event={event} />
          ))}
        </div>
      )}

      <div ref={loadMoreRef} className="py-2 text-center">
        {loadingMore ? (
          <div className="flex items-center justify-center py-4">
            <span className="text-sm text-muted-foreground">Loading more posts...</span>
          </div>
        ) : (
          <div className="h-8">{/* Spacer for intersection observer */}</div>
        )}
      </div>
    </div>
  );
};

export default UnifiedFeedTab;
