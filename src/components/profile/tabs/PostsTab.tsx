
import React from "react";
import NoteCard from "@/components/NoteCard";
import { NostrEvent } from "@/lib/nostr";
import { Loader2 } from "lucide-react";

interface PostsTabProps {
  displayedPosts: NostrEvent[];
  profileData: any;
  hasMore?: boolean;
  loading?: boolean;
  loadMoreRef?: (node: HTMLDivElement | null) => void;
}

export const PostsTab: React.FC<PostsTabProps> = ({ 
  displayedPosts, 
  profileData,
  hasMore = false,
  loading = false,
  loadMoreRef
}) => {
  if (!Array.isArray(displayedPosts) || displayedPosts.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No posts found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayedPosts.map(event => (
        <NoteCard 
          key={event.id} 
          event={event} 
          profileData={profileData || undefined} 
        />
      ))}
      
      {/* Infinite scroll loader */}
      {hasMore && (
        <div 
          ref={loadMoreRef} 
          className="py-4 flex justify-center"
        >
          {loading ? (
            <div className="flex items-center">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Loading more posts...</span>
            </div>
          ) : (
            <div className="h-8" /> /* Spacer for intersection observer */
          )}
        </div>
      )}
    </div>
  );
};
