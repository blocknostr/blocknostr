
import React from "react";
import { NostrEvent } from "@/lib/nostr";

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

  // Extract image URLs from event content
  const getFirstImageUrl = (event: NostrEvent): string | null => {
    if (!event.content) return null;
    
    const imgRegex = /(https?:\/\/\S+\.(jpg|jpeg|png|gif|webp)(\?[^\s]*)?)/i;
    const match = event.content.match(imgRegex);
    
    return match ? match[0] : null;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {displayedMedia.map(event => {
        const imageUrl = getFirstImageUrl(event);
        if (!imageUrl) return null;
        
        return (
          <div 
            key={event.id} 
            className="aspect-square overflow-hidden rounded-md border bg-muted cursor-pointer"
            onClick={() => {
              window.location.href = `/post/${event.id}`;
            }}
          >
            <img
              src={imageUrl}
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
