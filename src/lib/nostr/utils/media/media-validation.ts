
/**
 * Validation utilities for media URLs
 */

// List of trusted media domains for Nostr
const TRUSTED_MEDIA_HOSTS = [
  'i.imgur.com', 
  'media.nostr.band', 
  'void.cat', 
  'nostr.build', 
  'primal.net', 
  'mako.co.il', 
  'v.nostr.build',
  'image.nostr.build',
  'cdn.nostr.build',
  'nostrcheck.me',
  'media.snort.social',
  'files.zbd.gg',
  'imgproxy.snort.social'
];

/**
 * Normalizes a URL by ensuring it has a protocol
 * @param url The URL to normalize
 * @returns The normalized URL
 */
export const normalizeUrl = (url: string): string => {
  if (!url) return '';
  
  // Trim whitespace
  url = url.trim();
  
  // Check if the URL already has a protocol
  if (!/^https?:\/\//i.test(url)) {
    // Try to prepend https:// and see if it's valid
    try {
      new URL(`https://${url}`);
      return `https://${url}`;
    } catch (e) {
      // If that fails, just return the original
      return url;
    }
  }
  
  return url;
};

/**
 * Validates a URL to make sure it's properly formed
 * @param url The URL to validate
 * @returns Boolean indicating if the URL is valid
 */
export const isValidMediaUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    // Normalize URL
    const normalizedUrl = normalizeUrl(url);
    
    // Basic URL validation
    new URL(normalizedUrl);
    
    // Additional checks for media URLs
    // Ensure it has http/https protocol
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      return false;
    }
    
    // Check for common URL-shortener services that might redirect
    const commonShorteners = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl'];
    for (const shortener of commonShorteners) {
      if (normalizedUrl.includes(shortener)) {
        return true; // We'll assume shortened URLs might be valid media
      }
    }

    // Check for known media hosting domains
    for (const host of TRUSTED_MEDIA_HOSTS) {
      if (normalizedUrl.includes(host)) {
        return true; // Common Nostr media hosts
      }
    }
    
    // Check for common media extensions
    if (isImageUrl(normalizedUrl) || isVideoUrl(normalizedUrl) || isAudioUrl(normalizedUrl)) {
      return true;
    }
    
    return true; // If it passed URL validation, we'll give it a chance
  } catch (error) {
    console.error('Invalid URL:', url, error);
    return false;
  }
};

/**
 * Tests if a URL is an image by extension
 */
export const isImageUrl = (url: string): boolean => {
  try {
    return !!url.match(/\.(jpg|jpeg|png|gif|webp|svg|avif|bmp|tiff)(\?.*)?$/i);
  } catch (e) {
    return false;
  }
};

/**
 * Tests if a URL is a video by extension
 */
export const isVideoUrl = (url: string): boolean => {
  try {
    return !!url.match(/\.(mp4|webm|mov|m4v|ogv|avi|mkv|flv)(\?.*)?$/i);
  } catch (e) {
    return false;
  }
};

/**
 * Tests if a URL is audio by extension
 */
export const isAudioUrl = (url: string): boolean => {
  try {
    return !!url.match(/\.(mp3|wav|ogg|flac|aac|m4a)(\?.*)?$/i);
  } catch (e) {
    return false;
  }
};

/**
 * Checks if a URL points to a secure HTTPS resource
 */
export const isSecureUrl = (url: string): boolean => {
  if (!isValidMediaUrl(url)) return false;
  return url.startsWith('https://');
};

