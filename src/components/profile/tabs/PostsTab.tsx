
import React from "react";
import { NostrEvent } from "@/lib/nostr";
import NoteCard from "@/components/NoteCard";

interface PostsTabProps {
  posts: NostrEvent[];
  profileData: any;
}

const PostsTab: React.FC<PostsTabProps> = ({ posts, profileData }) => {
  if (!Array.isArray(posts) || posts.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No posts found.
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {posts.map(event => (
        <NoteCard 
          key={event.id} 
          event={event} 
          profileData={profileData || undefined} 
        />
      ))}
    </div>
  );
};

export default PostsTab;
