
import React from 'react';
import { NostrEvent } from '@/lib/nostr';
import NoteCard from '@/components/note/NoteCard';

interface PostListProps {
  events: NostrEvent[];
  showActionButtons?: boolean;
}

export function PostList({ events, showActionButtons = false }: PostListProps) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No posts found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <NoteCard 
          key={event.id} 
          event={event} 
          showActionButtons={showActionButtons} 
        />
      ))}
    </div>
  );
}

export default PostList;
