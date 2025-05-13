
/**
 * Validation utilities for media URLs
 */

/**
 * Normalizes a URL by trimming and handling special cases
 * @param url The URL to normalize
 * @returns Normalized URL string
 */
export const normalizeUrl = (url: string): string => {
  if (!url) return '';
  
  // Trim whitespace
  let normalized = url.trim();
  
  // Handle protocol-relative URLs
  if (normalized.startsWith('//')) {
    normalized = 'https:' + normalized;
  }
  
  // Handle URLs without protocol
  if (!/^https?:\/\//i.test(normalized) && !normalized.startsWith('data:')) {
    normalized = 'https://' + normalized;
  }
  
  try {
    // Standardize URL format
    const urlObj = new URL(normalized);
    return urlObj.toString();
  } catch (e) {
    console.warn('Invalid URL during normalization:', url);
    return normalized; // Return trimmed input if it's not a valid URL
  }
};

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
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:')) {
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
    const mediaHosts = ['i.imgur.com', 'media.nostr.band', 'void.cat', 'nostr.build', 
                       'nostrimg.com', 'telegra.ph', 'pbs.twimg.com', 'media.tenor.com',
                       'cloudflare-ipfs.com'];
    for (const host of mediaHosts) {
      if (url.includes(host)) {
        return true; // Common Nostr media hosts
      }
    }
    
    // Check for data URLs (e.g., embedded images)
    if (url.startsWith('data:image/')) {
      return true;
    }
    
    return true;
  } catch (error) {
    console.warn('Invalid URL:', url, error);
    return false;
  }
};

/**
 * Tests if a URL is an image by extension
 */
export const isImageUrl = (url: string): boolean => {
  if (!isValidMediaUrl(url)) return false;
  
  // Check for data URLs
  if (url.startsWith('data:image/')) return true;
  
  // Check file extensions
  return !!url.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/i);
};

/**
 * Tests if a URL is a video by extension
 */
export const isVideoUrl = (url: string): boolean => {
  if (!isValidMediaUrl(url)) return false;
  return !!url.match(/\.(mp4|webm|mov|m4v|ogv|avi)(\?.*)?$/i);
};

/**
 * Tests if a URL is audio by extension
 */
export const isAudioUrl = (url: string): boolean => {
  if (!isValidMediaUrl(url)) return false;
  return !!url.match(/\.(mp3|wav|ogg|flac|aac|m4a)(\?.*)?$/i);
};

/**
 * Checks if a URL points to a secure HTTPS resource
 */
export const isSecureUrl = (url: string): boolean => {
  if (!isValidMediaUrl(url)) return false;
  return url.startsWith('https://') || url.startsWith('data:');
};
