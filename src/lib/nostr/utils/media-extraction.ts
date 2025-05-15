
import { NostrEvent } from '@/lib/nostr';
import { mediaRegex, extractUrlsFromContent } from './media/media-detection';
import { isValidMediaUrl } from './media/media-validation';
import { getMediaItemsFromEvent as getOptimizedMediaItems, getFirstImageUrl, MediaItem } from './media/media-optimized';

/**
 * Extract media URLs from a Nostr event
 * Following NIP-94 recommendations for media content
 */
export const getMediaUrlsFromEvent = (event: NostrEvent | {content?: string, tags?: string[][]}): string[] => {
  // Use our optimized implementation
  return getOptimizedMediaItems(event).map(item => item.url);
};

/**
 * Extract the first image URL from a Nostr event
 */
export const getFirstImageUrlFromEvent = (event: NostrEvent | {content?: string, tags?: string[][]}): string | null => {
  return getFirstImageUrl(event);
};

/**
 * Extract image URLs from a Nostr event
 */
export const getImageUrlsFromEvent = (event: NostrEvent | {content?: string, tags?: string[][]}): string[] => {
  return getOptimizedMediaItems(event)
    .filter(item => item.type === 'image')
    .map(item => item.url);
};

/**
 * Get media items with metadata from event
 */
export interface MediaItem {
  url: string;
  type: 'image' | 'video' | 'audio' | 'unknown';
  alt?: string;
}

export { getOptimizedMediaItems as getMediaItemsFromEvent };

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

export { isValidMediaUrl, isImageUrl, isVideoUrl } from './media/media-validation';
