
/**
 * Utility functions for detecting media URLs in text
 * Following NIP-94 recommendations for media content
 */

/**
 * Regular expressions for detecting different types of media URLs
 */
export const mediaRegex = {
  // Image URLs (jpg, jpeg, png, gif, webp)
  image: /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)(\?[^\s]*)?)/gi,
  // Video URLs (mp4, webm, mov)
  video: /(https?:\/\/[^\s]+\.(mp4|webm|mov)(\?[^\s]*)?)/gi,
  // Audio URLs (mp3, wav, ogg)
  audio: /(https?:\/\/[^\s]+\.(mp3|wav|ogg)(\?[^\s]*)?)/gi,
  // General URLs - lower priority, used as fallback
  url: /(https?:\/\/[^\s]+)/gi
};

/**
 * Extracts media URLs from content text
 */
export const extractUrlsFromContent = (content: string): string[] => {
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
  
  try {
    while ((match = combinedRegex.exec(content)) !== null) {
      if (match[0]) {
        urls.push(match[0]);
      }
    }
  } catch (error) {
    console.error("Error extracting URLs from content:", error);
  }
  
  return urls;
};

/**
 * Extracts all URLs from content text, including regular links
 */
export const extractAllUrls = (content: string): string[] => {
  if (!content) return [];
  
  const urls: Set<string> = new Set();
  let match;
  
  // First extract media URLs
  const mediaUrls = extractUrlsFromContent(content);
  mediaUrls.forEach(url => urls.add(url));
  
  // Then extract any remaining URLs
  try {
    mediaRegex.url.lastIndex = 0; // Reset the regex state
    while ((match = mediaRegex.url.exec(content)) !== null) {
      const url = match[0];
      // Only add if not already added as a media URL
      if (!urls.has(url)) {
        urls.add(url);
      }
    }
  } catch (error) {
    console.error("Error extracting URLs from content:", error);
  }
  
  return [...urls];
};

/**
 * Checks if a URL is a media URL (image, video, audio)
 */
export const isMediaUrl = (url: string): boolean => {
  return !!(url.match(mediaRegex.image) || 
           url.match(mediaRegex.video) || 
           url.match(mediaRegex.audio));
};
