
/**
 * Utility functions for extracting media URLs from Nostr events
 * Following NIP-94 recommendations for media content
 */

import { NostrEvent } from '../types';

/**
 * Regular expressions for detecting different types of media URLs
 */
const mediaRegex = {
  // Image URLs (jpg, jpeg, png, gif, webp)
  image: /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)(\?[^\s]*)?)/gi,
  // Video URLs (mp4, webm, mov)
  video: /(https?:\/\/[^\s]+\.(mp4|webm|mov)(\?[^\s]*)?)/gi,
  // Audio URLs (mp3, wav, ogg)
  audio: /(https?:\/\/[^\s]+\.(mp3|wav|ogg)(\?[^\s]*)?)/gi,
  // General URLs - lower priority, used as fallback
  url: /(https?:\/\/[^\s]+)/gi
};

export interface MediaItem {
  url: string;
  type: 'image' | 'video' | 'audio' | 'url';
  alt?: string;
  dimensions?: {
    width?: number;
    height?: number;
  };
  blurhash?: string;
  metadata?: Record<string, any>;
}

/**
 * Extracts media URLs from content text
 */
const extractUrlsFromContent = (content: string): string[] => {
  if (!content) return [];

  const urls: string[] = [];
  
  // Extract image URLs
  let match;
  const combinedRegex = new RegExp(
    mediaRegex.image.source + '|' + 
    mediaRegex.video.source + '|' + 
    mediaRegex.audio.source,
    'gi'
  );
  
  while ((match = combinedRegex.exec(content)) !== null) {
    urls.push(match[0]);
  }
  
  return urls;
};

/**
 * Extracts media information from event tags following NIP-94
 * https://github.com/nostr-protocol/nips/blob/master/94.md
 */
const extractMediaFromTags = (tags: string[][]): MediaItem[] => {
  if (!Array.isArray(tags)) return [];
  
  const mediaTags = tags.filter(tag => 
    Array.isArray(tag) && 
    tag.length >= 2 && 
    ['media', 'image', 'imeta', 'video', 'audio'].includes(tag[0])
  );
  
  return mediaTags.map(tag => {
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
  });
};

/**
 * Main function to extract all media URLs from a Nostr event
 * Prioritizes structured data from tags over content parsing
 */
export const extractMediaUrls = (
  content: string | undefined, 
  tags: string[][] | undefined
): string[] => {
  const mediaItems: MediaItem[] = [];
  const urls: Set<string> = new Set();
  
  // First prioritize structured data from tags
  if (Array.isArray(tags)) {
    const tagMediaItems = extractMediaFromTags(tags);
    tagMediaItems.forEach(item => {
      mediaItems.push(item);
      urls.add(item.url);
    });
  }
  
  // Then extract URLs from content as fallback
  if (content) {
    const contentUrls = extractUrlsFromContent(content);
    contentUrls.forEach(url => {
      if (!urls.has(url)) {
        urls.add(url);
        mediaItems.push({ url, type: url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : 'url' });
      }
    });
  }
  
  // Return unique URLs
  return [...urls];
};

/**
 * Extract detailed media information including metadata from event
 */
export const extractMediaItems = (event?: NostrEvent): MediaItem[] => {
  if (!event) return [];
  
  const content = event.content;
  const tags = event.tags;
  
  const mediaItems: MediaItem[] = [];
  const urls: Set<string> = new Set();
  
  // First prioritize structured data from tags
  if (Array.isArray(tags)) {
    const tagMediaItems = extractMediaFromTags(tags);
    tagMediaItems.forEach(item => {
      mediaItems.push(item);
      urls.add(item.url);
    });
  }
  
  // Then extract URLs from content as fallback
  if (content) {
    const contentUrls = extractUrlsFromContent(content);
    contentUrls.forEach(url => {
      if (!urls.has(url)) {
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
export const extractFirstImageUrl = (content?: string, tags?: string[][]): string | null => {
  // First check tags for a cleaner URL source
  if (Array.isArray(tags)) {
    const imageTag = tags.find(tag => 
      Array.isArray(tag) && 
      tag.length >= 2 && 
      (tag[0] === 'image' || tag[0] === 'imeta') && 
      tag[1].match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)
    );
    
    if (imageTag && imageTag[1]) {
      return imageTag[1];
    }
  }
  
  // Fallback to content parsing for image URLs
  if (content) {
    const matches = content.match(mediaRegex.image);
    if (matches && matches.length > 0) {
      return matches[0];
    }
  }
  
  return null;
};
