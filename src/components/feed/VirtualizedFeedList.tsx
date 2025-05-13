
import React, { useState, useEffect, useRef } from "react";
import { NostrEvent } from "@/lib/nostr";
import NoteCard from "@/components/NoteCard";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ScrollArea } from "@/components/ui/scroll-area";

interface VirtualizedFeedListProps {
  events: NostrEvent[];
  profiles: Record<string, any>;
  repostData: Record<string, { pubkey: string, original: NostrEvent }>;
  loadMoreRef: React.RefObject<HTMLDivElement> | ((node: HTMLDivElement | null) => void);
  loading: boolean;
}

const VirtualizedFeedList: React.FC<VirtualizedFeedListProps> = ({
  events,
  profiles,
  repostData,
  loadMoreRef,
  loading
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Keep track of measured sizes
  const sizesCache = useRef<Record<string, number>>({});
  
  // Use TanStack Virtual for efficient list rendering
  const rowVirtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const event = events[index];
      // Return cached size if available, otherwise use estimations based on content
      if (event.id && sizesCache.current[event.id]) {
        return sizesCache.current[event.id];
      }
      
      // Improved base size estimate - consistent with OptimizedFeedList
      let estimatedSize = 120;
      
      // Add more height for longer content with more precise estimates
      if (event.content) {
        const contentLength = event.content.length;
        if (contentLength < 100) {
          estimatedSize += 20;
        } else if (contentLength < 280) {
          estimatedSize += 40;
        } else {
          estimatedSize += Math.min(60, contentLength / 10);
        }
      }
      
      // Better detection for images with more precise height estimates
      if (event.content?.match(/https?:\/\/\S+\.(jpg|jpeg|png|gif|webp)/i)) {
        estimatedSize += 250;
      }
      
      // Add height for hashtags
      if (Array.isArray(event.tags) && event.tags.some(tag => tag[0] === 't')) {
        estimatedSize += 26;
      }
      
      // Add fixed spacing between posts
      return estimatedSize + 8;
    },
    overscan: 3, // Reduced overscan for better performance 
    measureElement: (element) => {
      // Get the actual rendered height
      const height = element.getBoundingClientRect().height;
      
      // Get the event ID from the data attribute
      const eventId = element.getAttribute('data-event-id');
      
      // Store the measured height in our cache
      if (eventId) {
        sizesCache.current[eventId] = height + 8; // Add consistent 8px spacing
      }
      
      return height + 8;
    }
  });
  
  return (
    <div className="relative">
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div 
          ref={parentRef} 
          className="custom-scrollbar w-full"
        >
          {/* Total height spacer */}
          <div 
            style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}
          >
            {/* Only render visible posts */}
            {rowVirtualizer.getVirtualItems().map(virtualRow => {
              const event = events[virtualRow.index];
              return (
                <div
                  key={event.id}
                  data-event-id={event.id}
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
                    event={event} 
                    profileData={event.pubkey ? profiles[event.pubkey] : undefined}
                    repostData={event.id && repostData[event.id] ? {
                      reposterPubkey: repostData[event.id].pubkey,
                      reposterProfile: repostData[event.id].pubkey ? profiles[repostData[event.id].pubkey] : undefined
                    } : undefined}
                    feedVariant="virtualized"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
      
      {/* Loading indicator at the bottom */}
      <div ref={loadMoreRef as React.RefObject<HTMLDivElement>} className="py-4 text-center">
        {loading && events.length > 0 && (
          <div className="text-muted-foreground text-sm">
            Loading more posts...
          </div>
        )}
      </div>
    </div>
  );
};

export default VirtualizedFeedList;
