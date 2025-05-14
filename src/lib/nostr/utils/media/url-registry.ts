import { normalizeUrl } from './media-validation';

/**
 * URL Registry for tracking rendered URLs across components
 * Helps prevent duplicate rendering of the same URL in different formats
 */

// Global registry of URLs being rendered
// This is a singleton that persists across component renders
const urlRegistry = new Map<string, 'media' | 'link' | 'text'>();

// Keep track of registration counts to handle shared URLs
const urlRegistrationCount = new Map<string, number>();

export const UrlRegistry = {
  /**
   * Register a URL as being rendered in a specific format
   */
  registerUrl(url: string, type: 'media' | 'link' | 'text'): void {
    if (!url || typeof url !== 'string') {
      console.warn('Attempted to register invalid URL in UrlRegistry:', url);
      return;
    }
    
    try {
      const normalizedUrl = normalizeUrl(url);
      urlRegistry.set(normalizedUrl, type);
      
      // Increment registration count
      const currentCount = urlRegistrationCount.get(normalizedUrl) || 0;
      urlRegistrationCount.set(normalizedUrl, currentCount + 1);
      
      // Log duplicate registrations for debugging
      if (currentCount > 0) {
        console.debug(`URL registered ${currentCount + 1} times:`, normalizedUrl);
      }
    } catch (error) {
      console.error('Error registering URL in UrlRegistry:', url, error);
      // Still try to register the original URL to prevent rendering issues
      urlRegistry.set(url, type);
    }
  },

  /**
   * Register multiple URLs at once
   */
  registerUrls(urls: string[], type: 'media' | 'link' | 'text'): void {
    if (!Array.isArray(urls)) {
      console.warn('Attempted to register non-array URLs in UrlRegistry:', urls);
      return;
    }
    
    // Deduplicate URLs before registration
    const uniqueUrls = Array.from(new Set(urls));
    
    uniqueUrls.forEach(url => {
      if (url && typeof url === 'string') {
        this.registerUrl(url, type);
      }
    });
  },

  /**
   * Check if a URL is already being rendered
   */
  isUrlRegistered(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    
    try {
      const normalizedUrl = normalizeUrl(url);
      return urlRegistry.has(normalizedUrl);
    } catch (error) {
      console.error('Error checking URL in UrlRegistry:', url, error);
      return urlRegistry.has(url);
    }
  },

  /**
   * Get the render type for a URL
   */
  getUrlType(url: string): 'media' | 'link' | 'text' | undefined {
    if (!url || typeof url !== 'string') return undefined;
    
    try {
      const normalizedUrl = normalizeUrl(url);
      return urlRegistry.get(normalizedUrl);
    } catch (error) {
      console.error('Error getting URL type from UrlRegistry:', url, error);
      return urlRegistry.get(url);
    }
  },

  /**
   * Check if URL is registered as media
   */
  isUrlRegisteredAsMedia(url: string): boolean {
    return this.getUrlType(url) === 'media';
  },

  /**
   * Check if URL is registered as link
   */
  isUrlRegisteredAsLink(url: string): boolean {
    return this.getUrlType(url) === 'link';
  },

  /**
   * Decrement registration count for a URL and clear if count reaches 0
   */
  unregisterUrl(url: string): void {
    if (!url || typeof url !== 'string') return;
    
    try {
      const normalizedUrl = normalizeUrl(url);
      const count = urlRegistrationCount.get(normalizedUrl) || 0;
      
      if (count <= 1) {
        urlRegistry.delete(normalizedUrl);
        urlRegistrationCount.delete(normalizedUrl);
      } else {
        urlRegistrationCount.set(normalizedUrl, count - 1);
      }
    } catch (error) {
      console.error('Error unregistering URL from UrlRegistry:', url, error);
      urlRegistry.delete(url);
    }
  },

  /**
   * Clear specific URL from registry
   */
  clearUrl(url: string): void {
    if (!url || typeof url !== 'string') return;
    
    try {
      const normalizedUrl = normalizeUrl(url);
      urlRegistry.delete(normalizedUrl);
      urlRegistrationCount.delete(normalizedUrl);
    } catch (error) {
      console.error('Error clearing URL from UrlRegistry:', url, error);
      urlRegistry.delete(url);
    }
  },

  /**
   * Clear all URLs from registry
   * Useful for cleanup between page navigations
   */
  clearAll(): void {
    urlRegistry.clear();
    urlRegistrationCount.clear();
  },

  /**
   * Filter an array of URLs to only those not already registered
   */
  filterUnregisteredUrls(urls: string[]): string[] {
    if (!Array.isArray(urls)) return [];
    
    // Deduplicate the input URLs first
    const uniqueUrls = Array.from(new Set(urls));
    
    return uniqueUrls.filter(url => {
      if (!url || typeof url !== 'string') return false;
      return !this.isUrlRegistered(url);
    });
  },

  /**
   * Debug: get the current registry size
   */
  getSize(): number {
    return urlRegistry.size;
  },
  
  /**
   * Debug: get registration counts
   */
  getRegistrationCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    urlRegistrationCount.forEach((count, url) => {
      counts[url] = count;
    });
    return counts;
  }
};

// Auto-clear the registry every 5 minutes to prevent memory leaks
// This assumes most components won't be mounted that long
setInterval(() => UrlRegistry.clearAll(), 5 * 60 * 1000);

export default UrlRegistry;
