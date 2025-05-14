
/**
 * Simple URL Registry for tracking URLs across components
 * This prevents duplicate loading of media
 */

// Global registry of URLs being rendered
const urlRegistry = new Map<string, 'media' | 'link' | 'text'>();

export const UrlRegistry = {
  /**
   * Register a URL as being rendered in a specific format
   */
  registerUrl(url: string, type: 'media' | 'link' | 'text'): void {
    if (!url || typeof url !== 'string') return;
    urlRegistry.set(url, type);
  },

  /**
   * Register multiple URLs at once
   */
  registerUrls(urls: string[], type: 'media' | 'link' | 'text'): void {
    if (!Array.isArray(urls)) return;
    urls.forEach(url => {
      if (url && typeof url === 'string') {
        this.registerUrl(url, type);
      }
    });
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
   * Filter out URLs that are already registered
   * Returns only the URLs that are not already in the registry
   */
  filterUnregisteredUrls(urls: string[]): string[] {
    if (!Array.isArray(urls)) return [];
    return urls.filter(url => !this.isUrlRegistered(url));
  },

  /**
   * Unregister URL from registry
   */
  unregisterUrl(url: string): void {
    urlRegistry.delete(url);
  },

  /**
   * Clear all URLs from registry
   */
  clearAll(): void {
    urlRegistry.clear();
  },

  /**
   * Debug: get the current registry size
   */
  getSize(): number {
    return urlRegistry.size;
  }
};

export default UrlRegistry;
