
import React from "react";
import { NostrEvent } from "@/lib/nostr";
import { getFirstImageUrlFromEvent } from "@/lib/nostr/utils";
import EnhancedMediaContent from "@/components/media/EnhancedMediaContent";

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
        const imageUrl = getFirstImageUrlFromEvent(event);
        if (!imageUrl) return null;
        
        return (
          <div 
            key={event.id} 
            className="aspect-square overflow-hidden rounded-md border bg-muted cursor-pointer"
            onClick={() => {
              window.location.href = `/post/${event.id}`;
            }}
          >
            <EnhancedMediaContent
              url={imageUrl}
              alt="Media"
              className="h-full w-full object-cover"
            />
          </div>
        );
      }).filter(Boolean)}
    </div>
  );
};
