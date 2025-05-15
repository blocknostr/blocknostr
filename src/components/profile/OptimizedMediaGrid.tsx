
import React from 'react';
import { NostrEvent } from '@/lib/nostr';
import { useNavigate } from 'react-router-dom';
import { getImageUrlsFromEvent } from '@/lib/nostr/utils';

interface OptimizedMediaGridProps {
  events: NostrEvent[];
  columns?: number;
  maxItems?: number;
}

const OptimizedMediaGrid: React.FC<OptimizedMediaGridProps> = ({
  events,
  columns = 3,
  maxItems = 9
}) => {
  const navigate = useNavigate();
  
  if (!events || events.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        No media found
      </div>
    );
  }
  
  // Limit the number of events to display
  const limitedEvents = events.slice(0, maxItems);
  
  return (
    <div 
      className="grid gap-2 relative"
      style={{ 
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` 
      }}
    >
      {limitedEvents.map(event => {
        // Get all image URLs from the event
        const imageUrls = getImageUrlsFromEvent(event);
        
        // Skip this event if there are no images
        if (!imageUrls || imageUrls.length === 0) return null;
        
        // Just use the first image
        const primaryImage = imageUrls[0];
        
        return (
          <div 
            key={event.id} 
            className="aspect-square overflow-hidden rounded-sm cursor-pointer border"
            onClick={() => navigate(`/post/${event.id}`)}
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
      
      {/* Show more indicator if there are more events */}
      {events.length > maxItems && (
        <div 
          className="absolute bottom-2 right-2 bg-background/80 text-xs font-medium px-2 py-1 rounded"
        >
          +{events.length - maxItems} more
        </div>
      )}
    </div>
  );
};

export default OptimizedMediaGrid;
