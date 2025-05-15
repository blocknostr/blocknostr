
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
  // Image URLs (jpg, jpeg, png, gif, webp)
  image: /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg|avif)(\?[^\s]*)?)/gi,
  // Video URLs (mp4, webm, mov)
  video: /(https?:\/\/[^\s]+\.(mp4|webm|mov|m4v|ogv)(\?[^\s]*)?)/gi,
  // Audio URLs (mp3, wav, ogg)
  audio: /(https?:\/\/[^\s]+\.(mp3|wav|ogg|flac|aac)(\?[^\s]*)?)/gi,
  
  // YouTube URLs - comprehensive patterns for all YouTube formats
  youtube: /(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/v\/|youtu\.be\/)([a-zA-Z0-9_-]{11})([^\s]*)?/gi,
  
  // Cloudinary URLs with improved detection
  cloudinary: /(https?:\/\/[^\s]+\.cloudinary\.com\/[^\s]+)/gi,
  
  // Vimeo videos
  vimeo: /(https?:\/\/)?(www\.)?(vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|video\/|))(\d+)([^\s]*)?/gi,
  
  // SoundCloud tracks
  soundcloud: /(https?:\/\/)?(www\.)?(soundcloud\.com\/[^\s]+)/gi,
  
  // Spotify tracks, albums, playlists
  spotify: /(https?:\/\/)?(open\.)?spotify\.com\/(track|album|playlist|artist)\/[a-zA-Z0-9]+(\/[^\s]*)?/gi,
  
  // Twitter/X
  twitter: /(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/[^\s]+\/status\/[0-9]+([^\s]*)?/gi,
  
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
 * Extracts media URLs from content text
 */
export const extractUrlsFromContent = (content: string): string[] => {
  if (!content) return [];

  // Check cache first
  const cacheKey = `media-${content}`;
  if (urlParseCache.has(cacheKey)) {
    return urlParseCache.get(cacheKey) || [];
  }

  const urls: string[] = [];
  const seenBaseUrls = new Set<string>();
  
  // Define the order of media types to check for priority extraction
  const mediaTypes: Array<keyof typeof mediaRegex> = [
    'youtube', 'vimeo', 'soundcloud', 'spotify', 'twitter', 
    'cloudinary', 'image', 'video', 'audio'
  ];
  
  // Extract URLs for each media type in order of priority
  for (const mediaType of mediaTypes) {
    try {
      const regex = mediaRegex[mediaType];
      regex.lastIndex = 0; // Reset regex state
      
      let match;
      while ((match = regex.exec(content)) !== null) {
        if (match[0]) {
          const baseUrl = getBaseUrl(match[0]);
          if (!seenBaseUrls.has(baseUrl)) {
            urls.push(match[0]);
            seenBaseUrls.add(baseUrl);
          }
        }
      }
    } catch (error) {
      console.error(`Error extracting ${mediaType} URLs from content:`, error);
    }
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
  const cacheKey = `all-${content}`;
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
    mediaRegex.url.lastIndex = 0; // Reset the regex state
    let match;
    while ((match = mediaRegex.url.exec(content)) !== null) {
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
 * Checks if a URL is a media URL (image, video, audio, or platform-specific)
 */
export const isMediaUrl = (url: string): boolean => {
  // Check all media type regexes
  return !!(
    url.match(mediaRegex.image) || 
    url.match(mediaRegex.video) || 
    url.match(mediaRegex.audio) ||
    url.match(mediaRegex.youtube) ||
    url.match(mediaRegex.vimeo) ||
    url.match(mediaRegex.soundcloud) ||
    url.match(mediaRegex.spotify) ||
    url.match(mediaRegex.twitter) ||
    url.match(mediaRegex.cloudinary)
  );
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
 * Determine the most likely media type for a URL
 */
export const getMediaTypeFromUrl = (url: string): string => {
  if (url.match(mediaRegex.youtube)) return 'youtube';
  if (url.match(mediaRegex.vimeo)) return 'vimeo';
  if (url.match(mediaRegex.soundcloud)) return 'soundcloud';
  if (url.match(mediaRegex.spotify)) return 'spotify';
  if (url.match(mediaRegex.twitter)) return 'twitter';
  if (url.match(mediaRegex.image)) return 'image';
  if (url.match(mediaRegex.video)) return 'video';
  if (url.match(mediaRegex.audio)) return 'audio';
  if (url.match(mediaRegex.cloudinary)) {
    // Try to determine Cloudinary content type from URL
    if (url.includes('/video/')) return 'video';
    if (url.includes('/image/')) return 'image';
    if (url.includes('/audio/')) return 'audio';
    return 'image'; // Default to image for Cloudinary
  }
  return 'url';
};
