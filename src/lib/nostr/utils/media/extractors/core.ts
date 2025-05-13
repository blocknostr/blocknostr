
/**
 * Core media extraction utilities
 */
import { mediaRegex, extractUrlsFromContent, extractAllUrls, isMediaUrl } from '../media-detection';
import { isValidMediaUrl } from '../media-validation';
import UrlRegistry from '../url-registry';

/**
 * Main function to extract all media URLs from content
 * Filters out already registered URLs
 */
export const extractMediaUrls = (content: string): string[] => {
  if (!content) return [];
  
  // Extract URLs from content as fallback
  const contentUrls = extractUrlsFromContent(content);
  
  // Filter out URLs that are already registered
  return UrlRegistry.filterUnregisteredUrls(contentUrls);
};

/**
 * Extract non-media URLs for link previews
 * Returns an array of URLs that are not media files and not already registered
 */
export const extractLinkPreviewUrls = (content: string): string[] => {
  if (!content) return [];
  
  // Get all URLs from content
  const allUrls = extractAllUrls(content);
  
  // Filter out media URLs and already registered URLs
  return allUrls.filter(url => !isMediaUrl(url) && !UrlRegistry.isUrlRegistered(url));
};

/**
 * Extracts the first image URL from content
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
