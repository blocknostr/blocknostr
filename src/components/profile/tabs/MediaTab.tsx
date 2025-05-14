
import React from "react";
import { NostrEvent } from "@/lib/nostr";
import { getImageUrlsFromEvent } from "@/lib/nostr/utils";

interface MediaTabProps {
  displayedMedia: NostrEvent[];
}

export const MediaTab: React.FC<MediaTabProps> = ({ displayedMedia }) => {
  if (!displayedMedia || displayedMedia.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No media found.
      </div>
    );
  }

  return (
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
  );
};
