
/**
 * Utility functions for extracting media URLs from Nostr events
 * Following NIP-94 recommendations for media content
 */

import { NostrEvent } from '../types';

/**
 * Regular expressions for detecting different types of media URLs
 * Enhanced patterns to capture more URL variations
 */
const mediaRegex = {
  // Image URLs (jpg, jpeg, png, gif, webp, avif) with better query param handling
  image: /(https?:\/\/[^\s'"]+\.(jpg|jpeg|png|gif|webp|avif)(\?[^\s'"]*)?)/gi,
  // Video URLs (mp4, webm, mov, m4v) with better query param handling
  video: /(https?:\/\/[^\s'"]+\.(mp4|webm|mov|m4v)(\?[^\s'"]*)?)/gi,
  // Audio URLs (mp3, wav, ogg, flac) with better query param handling
  audio: /(https?:\/\/[^\s'"]+\.(mp3|wav|ogg|flac)(\?[^\s'"]*)?)/gi,
  // Common image hosting domains
  imageHosts: /(https?:\/\/(i\.imgur\.com|pbs\.twimg\.com|i\.ibb\.co|images\.unsplash\.com|media\.nostr\.build)\/[^\s'"]+)/gi,
  // General URLs - lower priority, used as fallback
  url: /(https?:\/\/[^\s'"]+)/gi
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
 * Extracts media URLs from content text with improved patterns
 */
const extractUrlsFromContent = (content: string): string[] => {
  if (!content) return [];

  const urls: string[] = [];
  
  try {
    // First check for image hosting domains (higher priority)
    let match;
    while ((match = mediaRegex.imageHosts.exec(content)) !== null) {
      if (match[0] && !urls.includes(match[0])) {
        urls.push(match[0]);
      }
    }
    
    // Reset the regex index
    mediaRegex.imageHosts.lastIndex = 0;
    
    // Extract standard media types
    const combinedRegex = new RegExp(
      mediaRegex.image.source + '|' + 
      mediaRegex.video.source + '|' + 
      mediaRegex.audio.source,
      'gi'
    );
    
    while ((match = combinedRegex.exec(content)) !== null) {
      if (match[0] && !urls.includes(match[0])) {
        urls.push(match[0]);
      }
    }
  } catch (error) {
    console.error("Error extracting URLs from content:", error);
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
export const extractMediaUrls = (
  content: string | undefined, 
  tags: string[][] | undefined
): string[] => {
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
        mediaItems.push({ url, type: url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : 'url' });
      }
    });
  }
  
  // Return unique URLs
  return [...urls];
};

/**
 * Extract detailed media information including metadata from event
 * Fixed to accept both direct params and event object
 */
export const extractMediaItems = (
  eventOrContent: NostrEvent | string | { content?: string; tags?: string[][] },
  maybeTags?: string[][]
): MediaItem[] => {
  let content: string | undefined;
  let tags: string[][] | undefined;
  
  // Handle different parameter formats
  if (typeof eventOrContent === 'string') {
    // Called with (content, tags)
    content = eventOrContent;
    tags = maybeTags;
  } else if (eventOrContent && typeof eventOrContent === 'object') {
    if ('content' in eventOrContent) {
      // Called with object that has content property
      content = eventOrContent.content;
      tags = 'tags' in eventOrContent ? eventOrContent.tags : undefined;
    } else {
      // Assume it's a NostrEvent
      content = (eventOrContent as NostrEvent).content;
      tags = (eventOrContent as NostrEvent).tags;
    }
  }
  
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
export const extractFirstImageUrl = (content?: string, tags?: string[][]): string | null => {
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
 * Validates a URL to make sure it's properly formed
 * Enhanced to handle more edge cases
 * @param url The URL to validate
 * @returns Boolean indicating if the URL is valid
 */
export const isValidMediaUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    // Check for common issues first
    if (url.includes(' ') || url.includes('\n')) return false;
    
    // Basic URL validation
    const parsedUrl = new URL(url);
    
    // Additional checks for media URLs
    const isHttp = parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    
    // Check for common image hosts
    const isCommonMediaHost = [
      'imgur.com', 'i.imgur.com',
      'pbs.twimg.com',
      'i.ibb.co',
      'media.nostr.build',
      'images.unsplash.com',
      'cloudfront.net',
      'imgproxy.snort.social'
    ].some(host => parsedUrl.hostname.includes(host));
    
    // Check for media file extensions
    const hasMediaExtension = /\.(jpg|jpeg|png|gif|webp|avif|mp4|webm|mov|m4v|mp3|wav|ogg|flac)(\?.*)?$/i.test(parsedUrl.pathname);
    
    return isHttp && (isCommonMediaHost || hasMediaExtension);
  } catch (error) {
    return false;
  }
};

/**
 * Tests if a URL is an image by extension or host
 * Enhanced to check more image hosts and handle edge cases
 */
export const isImageUrl = (url: string): boolean => {
  if (!isValidMediaUrl(url)) return false;
  
  try {
    const parsedUrl = new URL(url);
    
    // Check file extension
    const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|avif)(\?.*)?$/i.test(parsedUrl.pathname);
    
    // Check common image hosts that might not have extensions
    const isImageHost = [
      'imgur.com', 'i.imgur.com',
      'pbs.twimg.com',
      'i.ibb.co',
      'media.nostr.build',
      'images.unsplash.com',
      'imgproxy.snort.social'
    ].some(host => parsedUrl.hostname.includes(host));
    
    // Check for proxy services with image hints in query params
    const hasImageQueryParams = parsedUrl.search.includes('format=jpg') || 
                               parsedUrl.search.includes('format=png') ||
                               parsedUrl.search.includes('type=image');
    
    return hasImageExtension || isImageHost || hasImageQueryParams;
  } catch (error) {
    return false;
  }
};

/**
 * Tests if a URL is a video by extension or host
 * Enhanced to check more video hosts
 */
export const isVideoUrl = (url: string): boolean => {
  if (!isValidMediaUrl(url)) return false;
  
  try {
    const parsedUrl = new URL(url);
    
    // Check file extension
    const hasVideoExtension = /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(parsedUrl.pathname);
    
    // Check common video hosts
    const isVideoHost = [
      'youtube.com', 'youtu.be',
      'vimeo.com',
      'twitch.tv',
      'streamable.com',
    ].some(host => parsedUrl.hostname.includes(host));
    
    // Check for proxy services with video hints
    const hasVideoQueryParams = parsedUrl.search.includes('format=mp4') || 
                               parsedUrl.search.includes('type=video');
    
    return hasVideoExtension || isVideoHost || hasVideoQueryParams;
  } catch (error) {
    return false;
  }
};
