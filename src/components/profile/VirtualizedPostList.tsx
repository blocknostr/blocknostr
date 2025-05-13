
import React, { useRef, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { NostrEvent } from '@/lib/nostr';
import NoteCard from '@/components/note/NoteCard';
import { Skeleton } from '@/components/ui/skeleton';

interface VirtualizedPostListProps {
  posts: NostrEvent[];
  profileData?: any;
  isLoading: boolean;
  emptyMessage: string;
  referencedEvents?: Record<string, NostrEvent>;
  originalPostProfiles?: Record<string, any>;
  reactionData?: {
    emoji: string;
    reactionEvent: NostrEvent;
  };
  repostData?: {
    reposterPubkey: string;
    reposterProfile?: any;
  };
  isReply?: boolean;
}

const VirtualizedPostList = memo(({
  posts,
  profileData,
  isLoading,
  emptyMessage,
  referencedEvents,
  originalPostProfiles,
  reactionData,
  repostData,
  isReply
}: VirtualizedPostListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Show skeleton placeholders when loading
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-md p-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // Show empty message when no posts
  if (!posts || posts.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }
  
  // Setup virtualization for the list
  const rowVirtualizer = useVirtualizer({
    count: posts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 250, // Estimate post height
    overscan: 5, // Number of items to render beyond visible area
  });
  
  return (
    <div 
      ref={parentRef} 
      className="overflow-auto"
      style={{ 
        height: "calc(100vh - 280px)", 
        minHeight: "400px",
        maxHeight: "800px" 
      }}
    >
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}>
        {rowVirtualizer.getVirtualItems().map(virtualRow => {
          const post = posts[virtualRow.index];
          return (
            <div
              key={post.id}
              className="absolute top-0 left-0 w-full"
              style={{ 
                height: `${virtualRow.size}px`, 
                transform: `translateY(${virtualRow.start}px)` 
              }}
            >
              <NoteCard
                event={post}
                profileData={
                  post.pubkey === profileData?.pubkey 
                    ? profileData 
                    : originalPostProfiles?.[post.pubkey]
                }
                reactionData={reactionData}
                repostData={repostData}
                isReply={isReply}
                className="mb-4"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

VirtualizedPostList.displayName = 'VirtualizedPostList';
export default VirtualizedPostList;
