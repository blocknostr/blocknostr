/**
 * Image utility functions for handling external images safely
 */

// Domains known to have CORS or connection issues
const PROBLEMATIC_DOMAINS = [
  'bitcoinmagazine.com',
  'route96.pareto.space',
  'localhost' // Development environment images
];

// Fallback image URLs for different content types
export const FALLBACK_IMAGES = {
  article: '/images/fallback-article.png',
  profile: '/images/fallback-profile.png',
  default: '/images/fallback-generic.png'
};

/**
 * Check if a URL is from a domain known to have issues
 */
export const isProblematicDomain = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return PROBLEMATIC_DOMAINS.some(domain => 
      urlObj.hostname.includes(domain) || urlObj.hostname === domain
    );
  } catch {
    return true; // Invalid URLs are considered problematic
  }
};

/**
 * Validate and clean image URL to prevent ERR_ADDRESS_INVALID
 */
export const validateImageUrl = (url: string | null | undefined): string | null => {
  if (!url || typeof url !== 'string') return null;
  
  // Remove common invalid patterns
  const cleanUrl = url.trim();
  if (!cleanUrl || cleanUrl === 'null' || cleanUrl === 'undefined') return null;
  
  try {
    const urlObj = new URL(cleanUrl);
    
    // Check for valid protocols
    if (!['http:', 'https:', 'data:'].includes(urlObj.protocol)) {
      return null;
    }
    
    // Check for obviously invalid URLs
    if (urlObj.hostname === 'undefined' || urlObj.hostname === 'null') {
      return null;
    }
    
    return cleanUrl;
  } catch {
    // If URL constructor fails, it's invalid
    return null;
  }
};

/**
 * Get a proxy URL for external images (if needed)
 */
export const getProxiedImageUrl = (originalUrl: string): string => {
  const validUrl = validateImageUrl(originalUrl);
  if (!validUrl) return getFallbackImage('default');
  
  // In development, we could proxy through our Vite dev server
  if (import.meta.env.DEV && isProblematicDomain(validUrl)) {
    // For now, just return the original URL but log the issue
    console.debug(`[ImageUtils] Potentially problematic image domain: ${validUrl}`);
  }
  
  return validUrl;
};

/**
 * Get appropriate fallback image based on content type
 */
export const getFallbackImage = (type: 'article' | 'profile' | 'default' = 'default'): string => {
  return FALLBACK_IMAGES[type];
};

/**
 * Validate if an image URL is likely to work
 */
export const isValidImageUrl = (url: string): boolean => {
  const validUrl = validateImageUrl(url);
  if (!validUrl) return false;
  
  try {
    const urlObj = new URL(validUrl);
    const pathname = urlObj.pathname.toLowerCase();
    
    // Check for image file extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasImageExtension = imageExtensions.some(ext => pathname.endsWith(ext));
    
    // Check for known image hosting services
    const imageHosts = ['imgur.com', 'i.imgur.com', 'pbs.twimg.com', 'media.tenor.com'];
    const isImageHost = imageHosts.some(host => urlObj.hostname.includes(host));
    
    return hasImageExtension || isImageHost;
  } catch {
    return false;
  }
};

/**
 * Setup error filtering to reduce console noise from image loading failures
 */
export const setupImageErrorFiltering = (): void => {
  if (import.meta.env.DEV) {
    // Override console.error to filter out common image loading errors
    const originalConsoleError = console.error;
    
    console.error = (...args: any[]) => {
      const message = args[0]?.toString?.() || '';
      
      // Filter out common image loading errors that we handle gracefully
      const imageErrorPatterns = [
        'net::ERR_CONNECTION_RESET',
        'net::ERR_CONNECTION_REFUSED', 
        'net::ERR_TIMED_OUT',
        'net::ERR_ADDRESS_INVALID',
        'Failed to load image',
        'Image loading error'
      ];
      
      const isImageError = imageErrorPatterns.some(pattern => 
        message.includes(pattern)
      );
      
      // Only show non-image errors in console
      if (!isImageError) {
        originalConsoleError(...args);
      } else {
        console.debug('[Image Error Filtered]', ...args);
      }
    };
  }
}; 