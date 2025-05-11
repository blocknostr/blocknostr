
import React, { useState, useEffect, useRef } from "react";
import { NostrEvent } from "@/lib/nostr";
import NoteCard from "@/components/NoteCard";
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
  
  // Use TanStack Virtual for efficient list rendering with more compact sizing
  const rowVirtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 180, // Reduced estimated height for more compact tweets
    overscan: 5, // Number of items to render beyond visible area
  });
  
  // Calculate the total height
  const totalHeight = rowVirtualizer.getTotalSize();
  
  // Get the virtualized items
  const virtualItems = rowVirtualizer.getVirtualItems();
  
  return (
    <div className="relative">
      <div 
        ref={parentRef} 
        className="overflow-auto" 
        style={{ height: "calc(100vh - 180px)" }}
      >
        {/* Total height spacer */}
        <div style={{ height: totalHeight }}>
          {/* Only render visible posts */}
          {virtualItems.map(virtualRow => {
            const event = events[virtualRow.index];
            return (
              <div
                key={event.id}
                className="absolute w-full border-b border-border/40"
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
      <div ref={loadMoreRef as React.RefObject<HTMLDivElement>} className="py-2 text-center">
        {loading && events.length > 0 && (
          <div className="text-muted-foreground text-xs">
            Loading more posts...
          </div>
        )}
      </div>
    </div>
  );
};

export default VirtualizedFeedList;
