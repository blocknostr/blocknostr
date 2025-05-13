
/**
 * URL Registry for tracking rendered URLs across components
 * Helps prevent duplicate rendering of the same URL in different formats
 */

// Global registry of URLs being rendered
// This is a singleton that persists across component renders
const urlRegistry = new Map<string, 'media' | 'link' | 'text'>();

export const UrlRegistry = {
  /**
   * Register a URL as being rendered in a specific format
   */
  registerUrl(url: string, type: 'media' | 'link' | 'text'): void {
    urlRegistry.set(url, type);
  },

  /**
   * Register multiple URLs at once
   */
  registerUrls(urls: string[], type: 'media' | 'link' | 'text'): void {
    urls.forEach(url => urlRegistry.set(url, type));
  },

  /**
   * Check if a URL is already being rendered
   */
  isUrlRegistered(url: string): boolean {
    return urlRegistry.has(url);
  },

  /**
   * Get the render type for a URL
   */
  getUrlType(url: string): 'media' | 'link' | 'text' | undefined {
    return urlRegistry.get(url);
  },

  /**
   * Check if URL is registered as media
   */
  isUrlRegisteredAsMedia(url: string): boolean {
    return urlRegistry.get(url) === 'media';
  },

  /**
   * Check if URL is registered as link
   */
  isUrlRegisteredAsLink(url: string): boolean {
    return urlRegistry.get(url) === 'link';
  },

  /**
   * Clear specific URL from registry
   */
  clearUrl(url: string): void {
    urlRegistry.delete(url);
  },

  /**
   * Clear all URLs from registry
   * Useful for cleanup between page navigations
   */
  clearAll(): void {
    urlRegistry.clear();
  },

  /**
   * Filter an array of URLs to only those not already registered
   */
  filterUnregisteredUrls(urls: string[]): string[] {
    return urls.filter(url => !urlRegistry.has(url));
  },

  /**
   * Debug: get the current registry size
   */
  getSize(): number {
    return urlRegistry.size;
  }
};

// Auto-clear the registry every 5 minutes to prevent memory leaks
// This assumes most components won't be mounted that long
setInterval(() => UrlRegistry.clearAll(), 5 * 60 * 1000);

export default UrlRegistry;
