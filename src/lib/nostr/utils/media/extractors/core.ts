
/**
 * Core media extraction utilities - simplified
 */
import { mediaRegex, extractUrlsFromContent, extractAllUrls, isMediaUrl } from '../media-detection';

/**
 * Main function to extract all media URLs from content
 */
export const extractMediaUrls = (content: string): string[] => {
  if (!content) return [];
  
  // Extract URLs from content
  return extractUrlsFromContent(content);
};

/**
 * Extract non-media URLs for link previews
 * Returns an array of URLs that are not media files
 */
export const extractLinkPreviewUrls = (content: string): string[] => {
  if (!content) return [];
  
  // Get all URLs from content
  const allUrls = extractAllUrls(content);
  
  // Filter out media URLs
  return allUrls.filter(url => !isMediaUrl(url));
};

/**
 * Extracts the first image URL from content
 * Useful for generating thumbnails or previews
 */
export const extractFirstImageUrl = (content: string): string | null => {
  if (!content) return null;
  
  const matches = content.match(mediaRegex.image);
  if (matches && matches.length > 0) {
    return matches[0];
  }
  
  return null;
};
