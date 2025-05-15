
import React, { useState, useEffect, useRef } from "react";
import { NostrEvent } from "@/lib/nostr";
import NoteCard from "@/components/note/MemoizedNoteCard";
import { useVirtualizer } from "@tanstack/react-virtual";

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
  
  // Use TanStack Virtual for efficient list rendering
  const rowVirtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 250, // Estimated height of each post
    overscan: 5, // Number of items to render beyond visible area
  });
  
  // Calculate the total height
  const totalHeight = rowVirtualizer.getTotalSize();
  
  // Get the virtualized items
  const virtualItems = rowVirtualizer.getVirtualItems();
  
  return (
    <div className="space-y-4 relative">
      <div 
        ref={parentRef} 
        className="overflow-auto" 
        style={{ height: "calc(100vh - 200px)" }}
      >
        {/* Total height spacer */}
        <div style={{ height: totalHeight }}>
          {/* Only render visible posts */}
          {virtualItems.map(virtualRow => {
            const event = events[virtualRow.index];
            return (
              <div
                key={event.id}
                className="absolute w-full"
                style={{
                  top: virtualRow.start,
                  height: virtualRow.size,
                }}
              >
                <NoteCard 
                  key={event.id} 
                  event={event} 
                  profileData={event.pubkey ? profiles[event.pubkey] : undefined}
                  repostData={event.id && repostData[event.id] ? {
                    reposterPubkey: repostData[event.id].pubkey,
                    reposterProfile: repostData[event.id].pubkey ? profiles[repostData[event.id].pubkey] : undefined
                  } : undefined}
                />
              </div>
            );
          })}
        </div>
      </div>
      
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
