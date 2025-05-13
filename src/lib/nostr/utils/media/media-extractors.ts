
/**
 * Utility functions for extracting media from Nostr events
 * Following NIP-94 recommendations
 */

import { mediaRegex, extractUrlsFromContent, extractAllUrls, isMediaUrl } from './media-detection';
import { isValidMediaUrl } from './media-validation';
import { MediaItem } from './media-types';

/**
 * Extracts media information from event tags following NIP-94
 * https://github.com/nostr-protocol/nips/blob/master/94.md
 */
export const extractMediaFromTags = (tags: string[][]): MediaItem[] => {
  if (!Array.isArray(tags)) return [];
  
  const mediaTags = tags.filter(tag => 
    Array.isArray(tag) && 
    tag.length >= 2 && 
    ['media', 'image', 'imeta', 'video', 'audio'].includes(tag[0])
  );
  
  return mediaTags.map(tag => {
    if (!tag[1]) return null; // Skip invalid tags without URL
    
    // Basic media item with URL
    const mediaItem: MediaItem = {
      url: tag[1],
      type: 'image' // Default type
    };
    
    // Set the correct media type based on tag type or URL extension
    if (tag[0] === 'video' || tag[1].match(/\.(mp4|webm|mov)(\?.*)?$/i)) {
      mediaItem.type = 'video';
    } else if (tag[0] === 'audio' || tag[1].match(/\.(mp3|wav|ogg)(\?.*)?$/i)) {
      mediaItem.type = 'audio';
    } else if (tag[0] === 'image' || tag[0] === 'imeta' || tag[1].match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)) {
      mediaItem.type = 'image';
    } else {
      mediaItem.type = 'url';
    }
    
    // Extract metadata from imeta tags (NIP-94)
    if (tag[0] === 'imeta' && tag.length > 2) {
      try {
        // Parse dimensions if available
        if (tag[2] && tag[2].includes('x')) {
          const [width, height] = tag[2].split('x').map(Number);
          mediaItem.dimensions = { width, height };
        }
        
        // Get alt text if available
        if (tag.length > 3 && tag[3]) {
          mediaItem.alt = tag[3];
        }
        
        // Get blurhash if available
        if (tag.length > 4 && tag[4]) {
          mediaItem.blurhash = tag[4];
        }
      } catch (error) {
        console.error('Error parsing imeta tag:', error);
      }
    }
    
    return mediaItem;
  }).filter(Boolean) as MediaItem[]; // Filter out null items
};

/**
 * Main function to extract all media URLs from a Nostr event
 * Prioritizes structured data from tags over content parsing
 */
export const extractMediaUrls = (content: string): string[] => {
  if (!content) return [];
  
  // Extract URLs from content as fallback
  if (content) {
    const contentUrls = extractUrlsFromContent(content);
    return contentUrls;
  }
  
  return [];
};

/**
 * Helper function to extract media URLs from both content and tags
 * For backward compatibility
 */
export const getMediaUrlsFromEvent = (content: string, tags: string[][]): string[] => {
  if (!content && (!tags || !Array.isArray(tags))) return [];
  
  const urls: Set<string> = new Set();
  
  // First prioritize structured data from tags
  if (Array.isArray(tags)) {
    const mediaTags = tags.filter(tag => 
      Array.isArray(tag) && 
      tag.length >= 2 && 
      ['media', 'image', 'imeta', 'video', 'audio'].includes(tag[0])
    );
    
    mediaTags.forEach(tag => {
      if (tag[1]) urls.add(tag[1]);
    });
  }
  
  // Then extract URLs from content
  if (content) {
    const contentUrls = extractUrlsFromContent(content);
    contentUrls.forEach(url => urls.add(url));
  }
  
  return [...urls];
};

/**
 * Extract non-media URLs for link previews
 * Returns an array of URLs that are not media files
 */
export const extractLinkPreviewUrls = (content: string): string[] => {
  if (!content) return [];
  
  // Get all URLs from content
  const allUrls = extractAllUrls(content);
  
  // Filter out media URLs to get only regular links for previews
  return allUrls.filter(url => !isMediaUrl(url));
};

/**
 * Helper function to extract link preview URLs from both content and tags
 * For backward compatibility
 */
export const getLinkPreviewUrlsFromEvent = (content: string, tags: string[][]): string[] => {
  if (!content) return [];
  
  // Get all URLs from content
  const allUrls = extractAllUrls(content);
  
  // Get media URLs that we don't want to show as link previews
  const mediaUrls = new Set(getMediaUrlsFromEvent(content, tags));
  
  // Filter out media URLs to get only regular links for previews
  return allUrls.filter(url => !mediaUrls.has(url) && !isMediaUrl(url));
};

/**
 * Extract detailed media information including metadata from event
 */
export const extractMediaItems = (content: string): MediaItem[] => {
  if (!content) return [];
  
  const mediaItems: MediaItem[] = [];
  const urls: Set<string> = new Set();
  
  // Extract URLs from content
  if (content) {
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
  }
  
  return mediaItems;
};

/**
 * Helper function to extract media items from both content and tags
 * For backward compatibility
 */
export const getMediaItemsFromEvent = (content: string, tags: string[][]): MediaItem[] => {
  if (!content && (!tags || !Array.isArray(tags))) return [];
  
  const mediaItems: MediaItem[] = [];
  const urls: Set<string> = new Set();
  
  // First prioritize structured data from tags
  if (Array.isArray(tags)) {
    const tagMediaItems = extractMediaFromTags(tags);
    tagMediaItems.forEach(item => {
      if (item && item.url) {
        mediaItems.push(item);
        urls.add(item.url);
      }
    });
  }
  
  // Then extract URLs from content as fallback
  if (content) {
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
  }
  
  return mediaItems;
};

/**
 * Extracts the first image URL from content or tags
 * Useful for generating thumbnails or previews
 */
export const extractFirstImageUrl = (content: string): string | null => {
  // Fallback to content parsing for image URLs
  if (content) {
    const matches = content.match(mediaRegex.image);
    if (matches && matches.length > 0) {
      return matches[0];
    }
  }
  
  return null;
};

/**
 * Helper function to extract the first image URL from both content and tags
 * For backward compatibility
 */
export const getFirstImageUrlFromEvent = (content?: string, tags?: string[][]): string | null => {
  // First check tags for a cleaner URL source
  if (Array.isArray(tags)) {
    const imageTag = tags.find(tag => 
      Array.isArray(tag) && 
      tag.length >= 2 && 
      (tag[0] === 'image' || tag[0] === 'imeta') && 
      tag[1]?.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)
    );
    
    if (imageTag && imageTag[1]) {
      return imageTag[1];
    }
  }
  
  return extractFirstImageUrl(content || '');
};
