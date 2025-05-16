import { NostrEvent } from '@/lib/nostr';
import { mediaRegex, extractUrlsFromContent } from './media-detection';
import { isValidMediaUrl, isImageUrl, isVideoUrl, isAudioUrl } from './media-validation';
import { getMediaUrlFromNip94, isNip94FileEvent, getAltTextFromNip94 } from '../nip/nip94';
import { getTagValue } from '../nip/nip10';

// Define MediaItem interface here instead of importing it
export interface MediaItem {
  url: string;
  type: 'image' | 'video' | 'audio' | 'unknown';
  alt?: string;
  dimensions?: {
    width?: number;
    height?: number;
  };
  blurhash?: string;
}

/**
 * Extract media URLs from a Nostr event
 * Following NIP-94 and NIP-23 recommendations for media content
 */
export const getMediaUrlsFromEvent = (event: NostrEvent | {content?: string, tags?: string[][]}): string[] => {
  const content = event?.content || '';
  const tags = Array.isArray(event?.tags) ? event.tags : [];
  
  // Store unique URLs to avoid duplicates
  const uniqueUrls = new Set<string>();
  
  // First check for NIP-94 events if this is a valid Nostr event
  if ('kind' in event && event.kind === 1063) {
    const mediaUrl = getMediaUrlFromNip94(event as NostrEvent);
    if (mediaUrl) uniqueUrls.add(mediaUrl);
  }
  
  // Check for NIP-23 image tags
  if (Array.isArray(tags)) {
    tags.forEach(tag => {
      if (Array.isArray(tag) && 
          tag.length >= 2 && 
          (tag[0] === 'image' || tag[0] === 'img' || tag[0] === 'imeta') && 
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
  // Check for NIP-94 image first if this is a valid Nostr event
  if ('kind' in event && event.kind === 1063 && isNip94FileEvent(event as NostrEvent)) {
    const mediaUrl = getMediaUrlFromNip94(event as NostrEvent);
    if (mediaUrl && isImageUrl(mediaUrl)) return mediaUrl;
  }
  
  // Check for NIP-23 image tags first
  const tags = Array.isArray(event?.tags) ? event.tags : [];
  
  for (const tag of tags) {
    if (Array.isArray(tag) && 
        tag.length >= 2 && 
        (tag[0] === 'image' || tag[0] === 'img' || tag[0] === 'imeta') && 
        isValidMediaUrl(tag[1]) &&
        isImageUrl(tag[1])) {
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
  const mediaUrls = getMediaUrlsFromEvent(event);
  return mediaUrls.filter(url => isImageUrl(url));
};

/**
 * Get media items with metadata from event
 */
export const getMediaItemsFromEvent = (event: NostrEvent | {content?: string, tags?: string[][]}): MediaItem[] => {
  const urls = getMediaUrlsFromEvent(event);
  const tags = Array.isArray(event?.tags) ? event.tags : [];
  
  // Map URLs to media items
  return urls.map(url => {
    // Determine media type based on URL extension
    let type: MediaItem['type'] = 'unknown';
    if (isImageUrl(url)) {
      type = 'image';
    } else if (isVideoUrl(url)) {
      type = 'video';
    } else if (isAudioUrl(url)) {
      type = 'audio';
    }
    
    // Check for alt text in image tags
    let alt: string | undefined;
    
    // First check NIP-94 alt text if this is that kind of event
    if ('kind' in event && event.kind === 1063) {
      alt = getAltTextFromNip94(event as NostrEvent);
    }
    
    // If no alt text from NIP-94, check for it in tags (NIP-23)
    if (!alt) {
      const imgTag = tags.find(tag => 
        Array.isArray(tag) && 
        tag.length >= 3 && 
        (tag[0] === 'image' || tag[0] === 'img' || tag[0] === 'imeta') && 
        tag[1] === url
      );
      
      if (imgTag && imgTag.length >= 3) {
        alt = imgTag[2];
      }
    }
    
    return { url, type, alt };
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

export { isValidMediaUrl, isImageUrl, isVideoUrl } from './media-validation';
