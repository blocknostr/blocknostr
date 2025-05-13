
import React from "react";
import { NostrEvent } from "@/lib/nostr";
import { getFirstImageUrlFromEvent } from "@/lib/nostr/utils";

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
        const imageUrl = getFirstImageUrlFromEvent(event.content, event.tags);
        if (!imageUrl) return null;
        
        return (
          <div key={event.id} className="aspect-square overflow-hidden rounded-md border bg-muted">
            <img 
              src={imageUrl}
              alt="Media" 
              className="h-full w-full object-cover transition-all hover:scale-105"
              loading="lazy"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `/post/${event.id}`;
              }}
            />
          </div>
        );
      }).filter(Boolean)}
    </div>
  );
};
