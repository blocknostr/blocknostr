
/**
 * Validation utilities for media URLs and content
 */

// Approved media domains for better security
const APPROVED_MEDIA_DOMAINS = [
  'i.imgur.com',
  'imgur.com',
  'media.giphy.com',
  'giphy.com',
  'pbs.twimg.com',
  'nostr.build',
  'void.cat',
  'files.nostr.build',
  'image.nostr.build',
  'cdn.nostr.build',
  'cloudflare-ipfs.com'
];

// Maximum size for media files (10MB)
const MAX_MEDIA_SIZE = 10 * 1024 * 1024;

/**
 * Check if a URL is a valid media URL (image, video, audio)
 * @param url URL to validate
 */
export const isValidMediaUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    // Validate URL format
    const parsedUrl = new URL(url);
    
    // Check for secure protocol
    if (parsedUrl.protocol !== 'https:') return false;
    
    // Check file extension for common media types
    const path = parsedUrl.pathname.toLowerCase();
    const isMediaExtension = /\.(jpg|jpeg|png|gif|webp|mp4|webm|mov|mp3|wav|ogg)(\?.*)?$/.test(path);
    
    // If it's not a media extension, return false
    if (!isMediaExtension) return false;
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Check if a URL is specifically an image URL
 * @param url URL to check
 */
export const isImageUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    // Check for image file extensions
    return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url);
  } catch (error) {
    return false;
  }
};

/**
 * Check if a URL is specifically a video URL
 * @param url URL to check
 */
export const isVideoUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    // Check for video file extensions
    return /\.(mp4|webm|mov)(\?.*)?$/i.test(url);
  } catch (error) {
    return false;
  }
};

/**
 * Check if a URL is from an approved domain for better security
 * @param url URL to check
 */
export const isApprovedMediaDomain = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    
    // Check if hostname matches any approved domain
    return APPROVED_MEDIA_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch (error) {
    return false;
  }
};
