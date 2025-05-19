
import { NostrEvent } from "@/lib/nostr/types";

/**
 * Checks if a URL is a valid media URL
 * @param url URL to check
 * @returns boolean indicating if the URL is valid
 */
export const isValidMediaUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Checks if a URL is an image URL
 * @param url URL to check
 * @returns boolean indicating if the URL is an image
 */
export const isImageUrl = (url: string): boolean => {
  if (!isValidMediaUrl(url)) return false;
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  return imageExtensions.some(ext => url.toLowerCase().endsWith(ext));
};

/**
 * Checks if a URL is a video URL
 * @param url URL to check
 * @returns boolean indicating if the URL is a video
 */
export const isVideoUrl = (url: string): boolean => {
  if (!isValidMediaUrl(url)) return false;
  
  const videoExtensions = ['.mp4', '.webm', '.ogv', '.mov', '.avi'];
  return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
};

/**
 * Extract media URLs from content string
 * @param content Content string to extract from
 * @returns Array of media URLs found in the content
 */
export const extractMediaUrls = (content: string): string[] => {
  if (!content) return [];
  
  const urlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|mp4|webm|mov))/gi;
  const matches = content.match(urlRegex);
  
  return matches ? matches.filter(isValidMediaUrl) : [];
};

/**
 * Get the first image URL from content
 * @param content Content string to extract from
 * @returns First image URL or null if none found
 */
export const extractFirstImageUrl = (content: string): string | null => {
  const allUrls = extractMediaUrls(content);
  const imageUrl = allUrls.find(url => isImageUrl(url));
  return imageUrl || null;
};

/**
 * Extract media URLs from Nostr event
 * @param event Nostr event
 * @returns Array of media URLs
 */
export const getMediaUrlsFromEvent = (event: NostrEvent): string[] => {
  if (!event) return [];
  
  const urls: string[] = [];
  
  // Extract URLs from content
  if (event.content) {
    const contentUrls = extractMediaUrls(event.content);
    urls.push(...contentUrls);
  }
  
  // Extract URLs from image and img tags
  if (event.tags) {
    event.tags.forEach(tag => {
      if ((tag[0] === 'image' || tag[0] === 'img') && tag[1] && isValidMediaUrl(tag[1])) {
        urls.push(tag[1]);
      }
    });
  }
  
  // Remove duplicates
  return [...new Set(urls)];
};

/**
 * Get media items from Nostr event with metadata
 */
export const getMediaItemsFromEvent = (event: NostrEvent) => {
  const urls = getMediaUrlsFromEvent(event);
  
  return urls.map(url => ({
    url,
    type: isImageUrl(url) ? 'image' : isVideoUrl(url) ? 'video' : 'unknown',
    eventId: event.id
  }));
};

/**
 * Get first image URL from event
 * @param event Nostr event
 * @returns First image URL or null if none found
 */
export const getFirstImageUrlFromEvent = (event: NostrEvent): string | null => {
  const urls = getMediaUrlsFromEvent(event);
  const imageUrl = urls.find(url => isImageUrl(url));
  return imageUrl || null;
};
