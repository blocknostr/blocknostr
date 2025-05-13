
import React, { useRef } from 'react';
import { NostrEvent } from '@/lib/nostr';
import NoteCard from '@/components/NoteCard';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProfilePostsListProps {
  posts: NostrEvent[];
  profileData: any;
  loading: boolean;
  emptyMessage?: string;
}

const ProfilePostsList: React.FC<ProfilePostsListProps> = ({
  posts,
  profileData,
  loading,
  emptyMessage = "No posts found."
}) => {
  // Reference to the scrollable parent container
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Set up virtualization
  const rowVirtualizer = useVirtualizer({
    count: posts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated height of each post
    overscan: 5, // Number of items to render beyond visible area
  });
  
  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-24 w-full" />
            <div className="flex space-x-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // Empty state
  if (!posts || posts.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-[calc(100vh-350px)] min-h-[400px]">
      <div 
        ref={parentRef} 
        className="custom-scrollbar w-full"
      >
        {/* Define the container size based on virtualizer */}
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {/* Only render the visible items */}
          {rowVirtualizer.getVirtualItems().map(virtualRow => {
            const post = posts[virtualRow.index];
            return (
              <div
                key={post.id}
                style={{
                  position: 'absolute',
                  top: `${virtualRow.start}px`,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                }}
              >
                <div className="py-2">
                  <NoteCard 
                    event={post} 
                    profileData={profileData} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
};

export default ProfilePostsList;
