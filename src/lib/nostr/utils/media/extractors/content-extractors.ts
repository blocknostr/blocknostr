
/**
 * Utilities for extracting media items from content
 */
import { MediaItem } from '../media-types';
import { extractUrlsFromContent } from '../media-detection';

/**
 * Extract detailed media information from content
 */
export const extractMediaItems = (content: string): MediaItem[] => {
  if (!content) return [];
  
  const mediaItems: MediaItem[] = [];
  const urls: Set<string> = new Set();
  
  // Extract URLs from content
  const contentUrls = extractUrlsFromContent(content);
  contentUrls.forEach(url => {
    if (url && !urls.has(url)) {
      urls.add(url);
      
      // Determine media type based on URL extension
      let type: 'image' | 'video' | 'audio' | 'url' = 'url';
      if (url.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)) {
        type = 'image';
      } else if (url.match(/\.(mp4|webm|mov)(\?.*)?$/i)) {
        type = 'video';
      } else if (url.match(/\.(mp3|wav|ogg)(\?.*)?$/i)) {
        type = 'audio';
      }
      
      mediaItems.push({ url, type });
    }
  });
  
  return mediaItems;
};
