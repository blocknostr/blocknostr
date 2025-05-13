
import React from 'react';
import { NostrEvent } from '@/lib/nostr';
import { extractFirstImageUrl } from '@/lib/nostr/utils';
import { LazyImage } from '@/components/shared/LazyImage';

interface OptimizedMediaGridProps {
  media: NostrEvent[];
  postsLimit: number;
}

const OptimizedMediaGrid: React.FC<OptimizedMediaGridProps> = ({ media, postsLimit }) => {
  const displayedMedia = media.slice(0, postsLimit);
  
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
        const imageUrl = extractFirstImageUrl(event.content, event.tags);
        if (!imageUrl) return null;
        
        return (
          <div key={event.id} className="aspect-square overflow-hidden rounded-md border bg-muted">
            <LazyImage 
              src={imageUrl}
              alt="Media" 
              className="h-full w-full object-cover transition-all hover:scale-105"
              loadingClassName="animate-pulse bg-muted"
              errorClassName="bg-muted/50"
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

export default OptimizedMediaGrid;
