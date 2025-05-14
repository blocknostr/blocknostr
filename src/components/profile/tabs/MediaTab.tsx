
import React from "react";
import { NostrEvent } from "@/lib/nostr";
import { getImageUrlsFromEvent } from "@/lib/nostr/utils";
import { Loader2 } from "lucide-react";

interface MediaTabProps {
  displayedMedia: NostrEvent[];
  hasMore?: boolean;
  loadingMore?: boolean;
  loadMoreRef?: (node: HTMLDivElement | null) => void;
}

export const MediaTab: React.FC<MediaTabProps> = ({ 
  displayedMedia,
  hasMore = false,
  loadingMore = false,
  loadMoreRef
}) => {
  if (!displayedMedia || displayedMedia.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No media found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {displayedMedia.map(event => {
          const imageUrls = getImageUrlsFromEvent(event);
          if (!imageUrls || imageUrls.length === 0) return null;
          
          const primaryImage = imageUrls[0]; // Just use the first image
          
          return (
            <div 
              key={event.id} 
              className="aspect-square overflow-hidden rounded-md border bg-muted cursor-pointer"
              onClick={() => {
                window.location.href = `/post/${event.id}`;
              }}
            >
              <img
                src={primaryImage}
                alt="Media"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          );
        }).filter(Boolean)}
      </div>
      
      {/* Infinite scroll loader */}
      {hasMore && (
        <div 
          ref={loadMoreRef} 
          className="py-4 flex justify-center"
        >
          {loadingMore ? (
            <div className="flex items-center">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Loading more media...</span>
            </div>
          ) : (
            <div className="h-8" /> {/* Spacer for intersection observer */}
          )}
        </div>
      )}
    </div>
  );
};
