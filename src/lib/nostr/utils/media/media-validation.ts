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
  'nostrcheck.me', // Re-added
  'media.snort.social',
  'files.zbd.gg',
  'imgproxy.snort.social'
];

/**
 * Normalizes a URL by ensuring it has a protocol
 * @param url The URL to normalize
 * @returns The normalized URL
 */
export const normalizeUrl = (url: string | undefined | null): string => {
  if (!url || typeof url !== 'string') return ''; // Ensure it's a string and not empty

  // Trim whitespace
  const trimmedUrl = url.trim(); // Use const as it's not reassigned

  // Check if the URL already has a protocol
  if (!/^https?:\/\//i.test(trimmedUrl)) {
    // Try to prepend https:// and see if it's valid
    try {
      new URL(`https://${trimmedUrl}`);
      return `https://${trimmedUrl}`;
    } catch (e) {
      // If that fails, just return the original trimmed URL if it might be a path or fragment
      // or an empty string if it's likely not usable
      return trimmedUrl.includes('/') || trimmedUrl.startsWith('#') ? trimmedUrl : '';
    }
  }

  return trimmedUrl;
};

/**
 * Validates a URL to make sure it's properly formed
 * @param url The URL to validate
 * @returns Boolean indicating if the URL is valid
 */
export const isValidMediaUrl = (url: string | undefined | null): boolean => {
  if (!url || typeof url !== 'string' || url.trim() === '') return false;

  try {
    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl) return false; // If normalization results in an empty string, it's invalid

    // Try to instantiate a URL object. If it doesn't throw, consider it structurally valid enough to attempt loading.
    new URL(normalizedUrl);
    return true; // If new URL() doesn't throw, assume it's a potentially valid media URL
  } catch (error) {
    // console.error('Attempted to validate URL, but it was invalid:', url, error); // Optional: for debugging invalid URLs
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
    // Comprehensive list of video extensions
    return !!url.match(/\.(mp4|webm|mov|m4v|ogv|avi|wmv|mkv|flv)(\?.*)?$/i);
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

