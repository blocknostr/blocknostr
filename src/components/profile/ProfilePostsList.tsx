
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
  
  // Keep track of measured sizes
  const sizesCache = useRef<Record<string, number>>({});
  
  // Set up virtualization with dynamic size measurement
  const rowVirtualizer = useVirtualizer({
    count: posts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const post = posts[index];
      // Return cached size if available, otherwise use estimations based on content
      if (post.id && sizesCache.current[post.id]) {
        return sizesCache.current[post.id];
      }
      
      // Improved base size estimate - consistent with other feed components
      let estimatedSize = 120;
      
      // Add more height for longer content with more precise estimates
      if (post.content) {
        const contentLength = post.content.length;
        if (contentLength < 100) {
          estimatedSize += 20;
        } else if (contentLength < 280) {
          estimatedSize += 40;
        } else {
          estimatedSize += Math.min(60, contentLength / 10);
        }
      }
      
      // Better detection for images with more precise height estimates
      if (post.content?.match(/https?:\/\/\S+\.(jpg|jpeg|png|gif|webp)/i)) {
        estimatedSize += 250;
      }
      
      // Add height for hashtags
      if (Array.isArray(post.tags) && post.tags.some(tag => tag[0] === 't')) {
        estimatedSize += 26;
      }
      
      // Add consistent spacing between posts
      return estimatedSize + 8;
    },
    overscan: 3, // Reduced overscan for better performance
    measureElement: (element) => {
      // Get the actual rendered height
      const height = element.getBoundingClientRect().height;
      
      // Get the post ID from the data attribute
      const postId = element.getAttribute('data-event-id');
      
      // Store the measured height in our cache
      if (postId) {
        sizesCache.current[postId] = height + 8; // Add consistent 8px spacing
      }
      
      return height + 8;
    }
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
                data-event-id={post.id}
                style={{
                  position: 'absolute',
                  top: `${virtualRow.start}px`,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  padding: '0',
                  marginBottom: '0', // Remove any margin to ensure consistent spacing
                }}
              >
                <NoteCard 
                  event={post} 
                  profileData={profileData}
                  feedVariant="virtualized" 
                />
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
};

export default ProfilePostsList;
