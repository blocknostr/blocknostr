
import { NostrEvent } from '@/lib/nostr';
import { mediaRegex, extractUrlsFromContent } from './media/media-detection';
import { isValidMediaUrl, isImageUrl, isVideoUrl, isAudioUrl } from './media/media-validation';
import { extractNip94Media } from './media/nip94-media-extraction';
import { MediaItem } from './media/media-types';

/**
 * Extract media URLs from a Nostr event
 * Following NIP-94 recommendations for media content
 */
export const getMediaUrlsFromEvent = (event: NostrEvent | {content?: string, tags?: string[][]}): string[] => {
  // First try to extract media using NIP-94 standard
  if (event && 'tags' in event && Array.isArray(event.tags)) {
    const nip94Media = extractNip94Media(event as NostrEvent);
    if (nip94Media.length > 0) {
      return nip94Media.map(item => item.url);
    }
  }
  
  const content = event?.content || '';
  const tags = Array.isArray(event?.tags) ? event.tags : [];
  
  // Store unique URLs to avoid duplicates
  const uniqueUrls = new Set<string>();
  
  // First check for NIP-94 image tags
  if (Array.isArray(tags)) {
    tags.forEach(tag => {
      if (Array.isArray(tag) && 
          tag.length >= 2 && 
          (tag[0] === 'image' || tag[0] === 'img' || tag[0] === 'imeta' || 
           tag[0] === 'video' || tag[0] === 'audio' || tag[0] === 'media') && 
          isValidMediaUrl(tag[1])) {
        uniqueUrls.add(tag[1]);
      }
    });
  }
  
  // Then extract URLs from content
  const contentUrls = extractUrlsFromContent(content);
  contentUrls.forEach(url => uniqueUrls.add(url));
  
  return Array.from(uniqueUrls);
};

/**
 * Extract the first image URL from a Nostr event
 */
export const getFirstImageUrlFromEvent = (event: NostrEvent | {content?: string, tags?: string[][]}): string | null => {
  // Try NIP-94 extraction first
  if (event && 'tags' in event && Array.isArray(event.tags)) {
    const nip94Media = extractNip94Media(event as NostrEvent);
    const firstImage = nip94Media.find(item => item.type === 'image');
    if (firstImage) return firstImage.url;
  }

  // Check for NIP-94 image tags first
  const tags = Array.isArray(event?.tags) ? event.tags : [];
  
  for (const tag of tags) {
    if (Array.isArray(tag) && 
        tag.length >= 2 && 
        (tag[0] === 'image' || tag[0] === 'img' || tag[0] === 'imeta') && 
        isValidMediaUrl(tag[1])) {
      return tag[1];
    }
  }
  
  // Then check content
  const content = event?.content || '';
  if (!content) return null;
  
  // Simple regex to extract the first image URL from content
  const imgRegex = /(https?:\/\/\S+\.(jpg|jpeg|png|gif|webp)(\?[^\s]*)?)/i;
  const match = content.match(imgRegex);
  
  return match ? match[0] : null;
};

/**
 * Extract image URLs from a Nostr event
 */
export const getImageUrlsFromEvent = (event: NostrEvent | {content?: string, tags?: string[][]}): string[] => {
  // Try NIP-94 extraction first
  if (event && 'tags' in event && Array.isArray(event.tags)) {
    const nip94Media = extractNip94Media(event as NostrEvent);
    const imageUrls = nip94Media
      .filter(item => item.type === 'image')
      .map(item => item.url);
    
    if (imageUrls.length > 0) return imageUrls;
  }
  
  const mediaUrls = getMediaUrlsFromEvent(event);
  return mediaUrls.filter(url => {
    return isImageUrl(url);
  });
};

/**
 * Get media items with metadata from event
 */
export const getMediaItemsFromEvent = (event: NostrEvent | {content?: string, tags?: string[][]}): MediaItem[] => {
  // Try NIP-94 extraction first
  if (event && 'tags' in event && Array.isArray(event.tags)) {
    const nip94Media = extractNip94Media(event as NostrEvent);
    if (nip94Media.length > 0) return nip94Media;
  }
  
  const urls = getMediaUrlsFromEvent(event);
  const tags = Array.isArray(event?.tags) ? event.tags : [];
  
  // Map URLs to media items
  return urls.map(url => {
    // Determine media type based on URL extension
    let type: MediaItem['type'] = 'url';
    if (isImageUrl(url)) {
      type = 'image';
    } else if (isVideoUrl(url)) {
      type = 'video';
    } else if (isAudioUrl(url)) {
      type = 'audio';
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
      type = 'embed';
    }
    
    // Check for alt text in image tags
    let alt: string | undefined;
    const imgTag = tags.find(tag => 
      Array.isArray(tag) && 
      tag.length >= 3 && 
      (tag[0] === 'image' || tag[0] === 'img' || tag[0] === 'imeta' || 
       tag[0] === 'video' || tag[0] === 'audio') && 
      tag[1] === url
    );
    
    if (imgTag && imgTag.length >= 3) {
      alt = imgTag[2];
    }
    
    // Look for dimensions in the tag
    let dimensions;
    if (imgTag && imgTag.length >= 4) {
      try {
        if (typeof imgTag[3] === 'string' && imgTag[3].includes('x')) {
          const [width, height] = imgTag[3].split('x').map(Number);
          dimensions = { width, height };
        }
      } catch (e) {
        console.warn('Failed to parse dimensions from tag:', e);
      }
    }
    
    return { url, type, alt, dimensions };
  });
};

/**
 * Extract the first media URL from an event
 */
export const extractFirstImageUrl = (content: string): string | null => {
  if (!content) return null;
  
  const imgRegex = /(https?:\/\/\S+\.(jpg|jpeg|png|gif|webp)(\?[^\s]*)?)/i;
  const match = content.match(imgRegex);
  
  return match ? match[0] : null;
};

/**
 * Extract all media URLs from content
 */
export const extractMediaUrls = (content: string): string[] => {
  return extractUrlsFromContent(content);
};

// Export the functions from media-validation.ts and nip94-media-extraction.ts
export { 
  isValidMediaUrl, isImageUrl, isVideoUrl, isAudioUrl 
} from './media/media-validation';

export { 
  extractNip94Media, extractYoutubeVideoId, extractCloudinaryData, isEmbeddedContent 
} from './media/nip94-media-extraction';
