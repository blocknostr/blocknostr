
/**
 * Validation utilities for media URLs
 */

/**
 * Validates a URL to make sure it's properly formed
 * @param url The URL to validate
 * @returns Boolean indicating if the URL is valid
 */
export const isValidMediaUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    // Basic URL validation
    new URL(url);
    
    // Additional checks for media URLs
    return (
      url.startsWith('http://') || 
      url.startsWith('https://')
    );
  } catch (error) {
    return false;
  }
};

/**
 * Tests if a URL is an image by extension
 */
export const isImageUrl = (url: string): boolean => {
  if (!isValidMediaUrl(url)) return false;
  return !!url.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i);
};

/**
 * Tests if a URL is a video by extension
 */
export const isVideoUrl = (url: string): boolean => {
  if (!isValidMediaUrl(url)) return false;
  return !!url.match(/\.(mp4|webm|mov)(\?.*)?$/i);
};

/**
 * Tests if a URL is audio by extension
 */
export const isAudioUrl = (url: string): boolean => {
  if (!isValidMediaUrl(url)) return false;
  return !!url.match(/\.(mp3|wav|ogg)(\?.*)?$/i);
};
