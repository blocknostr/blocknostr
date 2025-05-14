
import React, { useState, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Event } from "nostr-tools";
import { nip19 } from "nostr-tools";
import { toast } from "@/components/ui/use-toast";
import { useInView } from "react-intersection-observer";
// Using temporary interface since we don't have the actual useProfile hook
import NoteCard from "@/components/NoteCard";

interface ProfileData {
  pubkey?: string;
}

interface PostsTabProps {
  displayedPosts: Event[];
  profileData: ProfileData;
  hasMore: boolean;
  loadMoreRef: (node: HTMLDivElement | null) => void;
}

const PostsTab: React.FC<PostsTabProps> = ({ displayedPosts, profileData, hasMore, loadMoreRef }) => {
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);

  return (
    <div className="space-y-4">
      {displayedPosts.length === 0 ? (
        <div className="py-4 text-center">
          <p className="text-muted-foreground">No posts found.</p>
        </div>
      ) : (
        <>
          {displayedPosts.map((event) => (
            <NoteCard key={event.id} event={event} />
          ))}
        </>
      )}
      
      <div ref={loadMoreRef} className="py-2 text-center">
        {loadMoreLoading ? (
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

export default PostsTab;
