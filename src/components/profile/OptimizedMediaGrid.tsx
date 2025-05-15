
import React from 'react';
import { NostrEvent } from '@/lib/nostr';
import { useNavigate } from 'react-router-dom';
import { extractNip94Media, getMediaItemsFromEvent } from '@/lib/nostr/utils/media-extraction';
import { MediaItem } from '@/lib/nostr/utils/media/media-types';

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
  
  // Extract all media items from events following NIP-94 spec
  const allMediaItems: Array<{eventId: string, media: MediaItem}> = React.useMemo(() => {
    const items: Array<{eventId: string, media: MediaItem}> = [];
    
    events.forEach(event => {
      // First try NIP-94 compliant extraction (preferred method)
      const nip94Media = extractNip94Media(event);
      
      if (nip94Media.length > 0) {
        nip94Media.forEach(media => {
          items.push({ eventId: event.id, media });
        });
      } else {
        // Fallback to standard extraction
        const mediaItems = getMediaItemsFromEvent(event);
        mediaItems.forEach(media => {
          items.push({ eventId: event.id, media });
        });
      }
    });
    
    // Filter image types first for the grid display
    return items.filter(item => item.media.type === 'image');
  }, [events]);
  
  // Limit the number of items to display
  const displayItems = allMediaItems.slice(0, maxItems);
  
  return (
    <div 
      className="grid gap-2 relative"
      style={{ 
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` 
      }}
    >
      {displayItems.map((item, index) => (
        <div 
          key={`${item.eventId}-${index}`} 
          className="aspect-square overflow-hidden rounded-sm cursor-pointer border"
          onClick={() => navigate(`/post/${item.eventId}`)}
        >
          <img
            src={item.media.url}
            alt={item.media.alt || "Media"}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      ))}
      
      {/* Show more indicator if there are more items */}
      {allMediaItems.length > maxItems && (
        <div 
          className="absolute bottom-2 right-2 bg-background/80 text-xs font-medium px-2 py-1 rounded"
          onClick={() => navigate(`/profile/media`)}
        >
          +{allMediaItems.length - maxItems} more
        </div>
      )}
    </div>
  );
};

export default OptimizedMediaGrid;
