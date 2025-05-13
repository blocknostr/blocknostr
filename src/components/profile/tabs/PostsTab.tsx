
import React from "react";
import NoteCard from "@/components/NoteCard";
import { NostrEvent } from "@/lib/nostr";

interface PostsTabProps {
  displayedPosts: NostrEvent[];
  profileData: any;
}

export const PostsTab: React.FC<PostsTabProps> = ({ displayedPosts, profileData }) => {
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
    </div>
  );
};
