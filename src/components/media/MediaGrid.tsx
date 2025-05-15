
import React from 'react';
import { MediaItem } from '@/lib/nostr/utils/media/media-types';
import MediaRenderer from './MediaRenderer';
import { cn } from '@/lib/utils';

interface MediaGridProps {
  mediaItems: MediaItem[];
  className?: string;
  maxItems?: number;
  onMediaClick?: (media: MediaItem, index: number) => void;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  mediaItems,
  className,
  maxItems = 4,
  onMediaClick,
}) => {
  if (!mediaItems || mediaItems.length === 0) return null;
  
  // Limit the number of items to display
  const displayItems = mediaItems.slice(0, maxItems);
  const hasMore = mediaItems.length > maxItems;
  
  // Determine grid layout based on number of items
  const getGridClass = () => {
    switch (displayItems.length) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-3 md:grid-cols-3"; // 3 columns on all screens
      case 4:
        return "grid-cols-2 sm:grid-cols-4"; // 2 columns on mobile, 4 on larger screens
      default:
        return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"; // Responsive grid for more items
    }
  };
  
  // Determine if an item should get special sizing
  const getItemClass = (index: number, total: number) => {
    // For a single item, take full width and height with natural aspect ratio
    if (total === 1) {
      return "col-span-1 row-span-1 aspect-auto max-h-[500px]";
    }
    
    // For 3 items, make the first one larger on mobile
    if (total === 3 && index === 0) {
      return "col-span-3 row-span-1 md:col-span-1 md:row-span-1 aspect-video md:aspect-square";
    }
    
    // For 4 or more items, use a square aspect ratio
    return "aspect-square";
  };
  
  // Group items by type for better layout
  const imageItems = displayItems.filter(item => item.type === 'image');
  const nonImageItems = displayItems.filter(item => item.type !== 'image');
  
  // Sort items so images are displayed first, then videos, then other media
  const sortedItems = [...imageItems, ...nonImageItems];
  
  return (
    <div className={cn(
      "mt-3 grid gap-2",
      getGridClass(),
      className
    )}>
      {sortedItems.map((item, index) => (
        <div 
          key={`${item.url}-${index}`} 
          className={cn(
            "relative overflow-hidden rounded-md border border-border/10",
            getItemClass(index, displayItems.length)
          )}
          onClick={() => onMediaClick?.(item, index)}
        >
          <MediaRenderer 
            media={item} 
            className="h-full w-full"
            fit={displayItems.length === 1 ? 'contain' : 'cover'}
            aspectRatio={displayItems.length === 1 ? 'auto' : 'square'}
          />
          
          {/* Show "more" indicator on the last visible item if there are more */}
          {hasMore && index === maxItems - 1 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-medium">
              +{mediaItems.length - maxItems} more
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MediaGrid;
