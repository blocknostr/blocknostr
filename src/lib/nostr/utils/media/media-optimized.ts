
import { NostrEvent } from '@/lib/nostr';
import { isValidMediaUrl } from './media-validation';

/**
 * Optimized media item detection with cached results
 */
const mediaCache = new Map<string, any[]>();

/**
 * Clear the media cache (can be called when memory needs to be freed)
 */
export const clearMediaCache = () => {
  mediaCache.clear();
};

/**
 * Get media items with metadata from event with caching
 * This function caches results by event ID for better performance
 */
export interface MediaItem {
  url: string;
  type: 'image' | 'video' | 'audio' | 'unknown';
  alt?: string;
  dimensions?: { width?: number, height?: number };
  blurhash?: string;
}

export const getMediaItemsFromEvent = (event: NostrEvent | {content?: string, tags?: string[][], id?: string}): MediaItem[] => {
  // Use event ID as cache key if available
  const cacheKey = event.id || '';
  
  // Return cached result if available
  if (cacheKey && mediaCache.has(cacheKey)) {
    return mediaCache.get(cacheKey) as MediaItem[];
  }
  
  const urls = new Set<string>();
  const mediaItems: MediaItem[] = [];
  const content = event?.content || '';
  const tags = Array.isArray(event?.tags) ? event.tags : [];
  
  // First check for NIP-94 image/media tags
  if (Array.isArray(tags)) {
    tags.forEach(tag => {
      if (Array.isArray(tag) && tag.length >= 2) {
        // Handle standard image tags
        if ((tag[0] === 'image' || tag[0] === 'img') && isValidMediaUrl(tag[1])) {
          if (!urls.has(tag[1])) {
            urls.add(tag[1]);
            const item: MediaItem = { 
              url: tag[1], 
              type: 'image',
              alt: tag.length >= 3 ? tag[2] : undefined 
            };
            mediaItems.push(item);
          }
        }
        
        // Handle imeta tags with dimensions
        if (tag[0] === 'imeta' && isValidMediaUrl(tag[1])) {
          if (!urls.has(tag[1])) {
            urls.add(tag[1]);
            
            // Parse dimensions if available (typically in tag[2] as width x height)
            let dimensions;
            if (tag.length >= 3 && tag[2]?.includes('x')) {
              const [width, height] = tag[2].split('x').map(Number);
              dimensions = { width, height };
            }
            
            // Parse blurhash if available (typically in tag[3])
            const blurhash = tag.length >= 4 ? tag[3] : undefined;
            
            const item: MediaItem = { 
              url: tag[1], 
              type: 'image',
              alt: tag.length >= 5 ? tag[4] : undefined,
              dimensions,
              blurhash
            };
            mediaItems.push(item);
          }
        }
      }
    });
  }
  
  // Then extract URLs from content if we don't have too many already
  if (mediaItems.length < 4 && content) {
    // Simple regex to extract image URLs
    const imgRegex = /(https?:\/\/\S+\.(jpg|jpeg|png|gif|webp)(\?[^\s]*)?)/gi;
    let match;
    
    while ((match = imgRegex.exec(content)) !== null && mediaItems.length < 4) {
      if (match[0] && !urls.has(match[0])) {
        urls.add(match[0]);
        mediaItems.push({
          url: match[0],
          type: 'image'
        });
      }
    }
  }
  
  // Cache the result if we have an event ID
  if (cacheKey) {
    mediaCache.set(cacheKey, mediaItems);
    
    // Limit cache size to prevent memory issues
    if (mediaCache.size > 500) {
      // Remove oldest entries
      const keysToDelete = Array.from(mediaCache.keys()).slice(0, 100);
      keysToDelete.forEach(key => mediaCache.delete(key));
    }
  }
  
  return mediaItems;
};

/**
 * Get the first image url from an event (optimized)
 */
export const getFirstImageUrl = (event: NostrEvent | {content?: string, tags?: string[][], id?: string}): string | null => {
  const items = getMediaItemsFromEvent(event);
  return items.length > 0 ? items[0].url : null;
};
