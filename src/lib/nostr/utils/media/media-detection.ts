/**
 * Utility functions for detecting media URLs in text
 * Following NIP-94 recommendations for media content
 */

// Keep a cache of parsed URLs to avoid redundant regex operations
const urlParseCache = new Map<string, string[]>();

/**
 * Regular expressions for detecting different types of media URLs
 */
export const mediaRegex = {
  // Image URLs (jpg, jpeg, png, gif, webp, avif, svg, bmp, tiff)
  image: /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|avif|svg|bmp|tiff)(\?[^\s]*)?)/gi,
  // Video URLs (mp4, webm, mov, m4v, ogv, avi, wmv, mkv, flv)
  video: /(https?:\/\/[^\s]+\.(mp4|webm|mov|m4v|ogv|avi|wmv|mkv|flv)(\?[^\s]*)?)/gi,
  // Audio URLs (mp3, wav, ogg, flac, aac, m4a)
  audio: /(https?:\/\/[^\s]+\.(mp3|wav|ogg|flac|aac|m4a)(\?[^\s]*)?)/gi, // Removed '$' anchor, ensured 'gi' flags and correct object syntax.
  // General URLs - lower priority, used as fallback
  url: /(https?:\/\/[^\s]+)/gi
};

/**
 * Gets base URL without query parameters
 * Used for URL deduplication
 */
export const getBaseUrl = (url: string): string => {
  try {
    // Remove query parameters and hash
    return url.split('?')[0].split('#')[0];
  } catch (e) {
    return url;
  }
};

/**
 * Cleans up the URL cache to prevent memory leaks
 */
export const cleanUrlCache = (): void => {
  // Only clean if cache gets too large
  if (urlParseCache.size > 1000) {
    console.log("Cleaning URL parse cache...");
    urlParseCache.clear();
  }
};

/**
 * Extracts media URLs from content text
 */
export const extractUrlsFromContent = (content: string): string[] => {
  if (!content) return [];

  // Check cache first
  const cacheKey = `media-${content.substring(0, 100)}`; // Use first 100 chars as key to avoid huge keys
  if (urlParseCache.has(cacheKey)) {
    return urlParseCache.get(cacheKey) || [];
  }

  const urls: string[] = [];
  const seenBaseUrls = new Set<string>();

  // Extract image URLs
  let match;
  const combinedRegex = new RegExp(
    mediaRegex.image.source + '|' +
    mediaRegex.video.source + '|' +
    mediaRegex.audio.source,
    'gi'
  );

  try {
    while ((match = combinedRegex.exec(content)) !== null) {
      if (match[0]) {
        const baseUrl = getBaseUrl(match[0]);

        // Only add if we haven't seen this base URL before
        if (!seenBaseUrls.has(baseUrl)) {
          urls.push(match[0]);
          seenBaseUrls.add(baseUrl);
        }
      }
    }
  } catch (error) {
    console.error("Error extracting URLs from content:", error);
  }

  // Store in cache
  urlParseCache.set(cacheKey, urls);

  return urls;
};

/**
 * Extracts all URLs from content text, including regular links
 */
export const extractAllUrls = (content: string): string[] => {
  if (!content) return [];

  // Check cache first
  const cacheKey = `all-${content.substring(0, 100)}`; // Use first 100 chars as key
  if (urlParseCache.has(cacheKey)) {
    return urlParseCache.get(cacheKey) || [];
  }

  const urls: string[] = [];
  const seenBaseUrls = new Set<string>();

  // First extract media URLs
  const mediaUrls = extractUrlsFromContent(content);
  mediaUrls.forEach(url => {
    const baseUrl = getBaseUrl(url);
    seenBaseUrls.add(baseUrl);
    urls.push(url);
  });

  // Then extract any remaining URLs
  try {
    const urlRegex = new RegExp(mediaRegex.url.source, 'gi');
    let match;
    while ((match = urlRegex.exec(content)) !== null) {
      const url = match[0];
      const baseUrl = getBaseUrl(url);

      // Only add if not already added as a media URL
      if (!seenBaseUrls.has(baseUrl)) {
        urls.push(url);
        seenBaseUrls.add(baseUrl);
      }
    }
  } catch (error) {
    console.error("Error extracting URLs from content:", error);
  }

  // Store in cache
  urlParseCache.set(cacheKey, urls);

  return urls;
};

/**
 * Checks if a URL is a media URL (image, video, audio)
 */
export const isMediaUrl = (url: string): boolean => {
  if (!url) return false;

  try {
    return !!(url.match(mediaRegex.image) ||
      url.match(mediaRegex.video) ||
      url.match(mediaRegex.audio));
  } catch (e) {
    return false;
  }
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
