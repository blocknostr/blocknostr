
/**
 * Validation utilities for media URLs
 */

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
    
    // Handle special cases like YouTube and Cloudinary
    if (
      normalizedUrl.includes('youtube.com') || 
      normalizedUrl.includes('youtu.be') ||
      normalizedUrl.includes('cloudinary.com')
    ) {
      return true;
    }
    
    // Check for common URL-shortener services that might redirect
    const commonShorteners = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl'];
    for (const shortener of commonShorteners) {
      if (normalizedUrl.includes(shortener)) {
        return true; // We'll assume shortened URLs might be valid media
      }
    }

    // Check for known media hosting domains
    const mediaHosts = [
      'i.imgur.com', 'media.nostr.band', 'void.cat', 'nostr.build', 
      'primal.net', 'mako.co.il', 'v.nostr.build', 'pbs.twimg.com',
      'media.giphy.com', 'giphy.com', 'gph.is', 'tenor.com',
      'vimeo.com', 'spotify.com', 'soundcloud.com'
    ];
    for (const host of mediaHosts) {
      if (normalizedUrl.includes(host)) {
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
  
  // Check for Cloudinary images
  if (url.includes('cloudinary.com') && !url.match(/\.(mp4|webm|mov|m4v|ogv|mp3|wav|ogg)(\?.*)?$/i)) {
    return true;
  }
  
  return !!url.match(/\.(jpg|jpeg|png|gif|webp|svg|avif|bmp|tiff?)(\?.*)?$/i);
};

/**
 * Tests if a URL is a video by extension
 */
export const isVideoUrl = (url: string): boolean => {
  if (!isValidMediaUrl(url)) return false;
  
  // Check for YouTube videos
  if (url.includes('youtube.com/') || url.includes('youtu.be/')) {
    return true;
  }
  
  // Check for Cloudinary videos
  if (url.includes('cloudinary.com') && url.match(/\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i)) {
    return true;
  }
  
  return !!url.match(/\.(mp4|webm|mov|m4v|ogv|avi|mkv)(\?.*)?$/i);
};

/**
 * Tests if a URL is audio by extension
 */
export const isAudioUrl = (url: string): boolean => {
  if (!isValidMediaUrl(url)) return false;
  
  // Check for Cloudinary audio
  if (url.includes('cloudinary.com') && url.match(/\.(mp3|wav|ogg|flac|aac)(\?.*)?$/i)) {
    return true;
  }
  
  return !!url.match(/\.(mp3|wav|ogg|flac|aac|m4a)(\?.*)?$/i);
};

/**
 * Checks if a URL points to a secure HTTPS resource
 */
export const isSecureUrl = (url: string): boolean => {
  if (!isValidMediaUrl(url)) return false;
  return url.startsWith('https://');
};

/**
 * Tests if a URL is a YouTube video
 */
export const isYoutubeUrl = (url: string): boolean => {
  if (!isValidMediaUrl(url)) return false;
  return url.includes('youtube.com/') || url.includes('youtu.be/');
};

/**
 * Tests if a URL is from Cloudinary
 */
export const isCloudinaryUrl = (url: string): boolean => {
  if (!isValidMediaUrl(url)) return false;
  return url.includes('cloudinary.com/');
};
