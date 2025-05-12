
import React from 'react';
import { NoteCard } from '@/components/note';
import { Skeleton } from '@/components/ui/skeleton';

interface PostListProps {
  events: any[];
  showActionButtons?: boolean;
  isLoading?: boolean;
}

export function PostList({ events, showActionButtons = false, isLoading = false }: PostListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
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
