
import React from "react";
import NoteCard from "@/components/NoteCard";
import { NostrEvent } from "@/lib/nostr";
import { Loader2 } from "lucide-react";

interface ExtendedNostrEvent extends NostrEvent {
  postType?: 'post' | 'reply' | 'repost';
  repost?: boolean;
  repostData?: {
    created_at?: number;
    pubkey?: string;
    id?: string;
  };
}

interface UnifiedFeedTabProps {
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  feedItems: ExtendedNostrEvent[];
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
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading posts...</span>
        </div>
      ) : feedItems.length === 0 ? (
        <div className="flex items-center justify-center py-8 border border-dashed border-muted-foreground/20 rounded-lg">
          <span className="text-sm text-muted-foreground">No posts found.</span>
        </div>
      ) : (
        <div className="space-y-4">
          {feedItems.map((event) => (
            <NoteCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* This is the element that triggers loading more content when it enters viewport */}
      <div 
        ref={loadMoreRef} 
        className="py-4 text-center"
        data-testid="load-more-trigger"
      >
        {loadingMore && (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary" />
            <span className="text-sm text-muted-foreground">Loading more posts...</span>
          </div>
        )}
        
        {/* Always render this empty div even when not loading to ensure IntersectionObserver works */}
        {!loadingMore && hasMore && (
          <div className="h-10">{/* Spacer for intersection observer */}</div>
        )}
        
        {/* Message when all posts are loaded */}
        {!loadingMore && !hasMore && feedItems.length > 0 && (
          <span className="text-xs text-muted-foreground">No more posts to load</span>
        )}
      </div>
    </div>
  );
};

export default UnifiedFeedTab;
