
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
    // Ensure it has http/https protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return false;
    }
    
    // Check for common URL-shortener services that might redirect
    const commonShorteners = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl'];
    for (const shortener of commonShorteners) {
      if (url.includes(shortener)) {
        return true; // We'll assume shortened URLs might be valid media
      }
    }

    // Check for known media hosting domains
    const mediaHosts = ['i.imgur.com', 'media.nostr.band', 'void.cat', 'nostr.build'];
    for (const host of mediaHosts) {
      if (url.includes(host)) {
        return true; // Common Nostr media hosts
      }
    }
    
    return true;
  } catch (error) {
    console.log('Invalid URL:', url, error);
    return false;
  }
};

/**
 * Tests if a URL is an image by extension
 */
export const isImageUrl = (url: string): boolean => {
  if (!isValidMediaUrl(url)) return false;
  return !!url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i);
};

/**
 * Tests if a URL is a video by extension
 */
export const isVideoUrl = (url: string): boolean => {
  if (!isValidMediaUrl(url)) return false;
  return !!url.match(/\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i);
};

/**
 * Tests if a URL is audio by extension
 */
export const isAudioUrl = (url: string): boolean => {
  if (!isValidMediaUrl(url)) return false;
  return !!url.match(/\.(mp3|wav|ogg|flac|aac)(\?.*)?$/i);
};

/**
 * Checks if a URL points to a secure HTTPS resource
 */
export const isSecureUrl = (url: string): boolean => {
  if (!isValidMediaUrl(url)) return false;
  return url.startsWith('https://');
};
