
/**
 * URL Registry for tracking rendered URLs across components
 * Helps prevent duplicate rendering of the same URL in different formats
 */
import { normalizeUrl } from './media-validation';

// Global registry of URLs being rendered
// This is a singleton that persists across component renders
const urlRegistry = new Map<string, 'media' | 'link' | 'text'>();

// Track when the registry was last cleared
let lastCleared = Date.now();

export const UrlRegistry = {
  /**
   * Register a URL as being rendered in a specific format
   */
  registerUrl(url: string, type: 'media' | 'link' | 'text'): void {
    // Normalize the URL for consistent matching
    const normalizedUrl = normalizeUrl(url);
    urlRegistry.set(normalizedUrl, type);
  },

  /**
   * Register multiple URLs at once
   */
  registerUrls(urls: string[], type: 'media' | 'link' | 'text'): void {
    urls.forEach(url => {
      const normalizedUrl = normalizeUrl(url);
      urlRegistry.set(normalizedUrl, type);
    });
  },

  /**
   * Check if a URL is already being rendered
   */
  isUrlRegistered(url: string): boolean {
    const normalizedUrl = normalizeUrl(url);
    return urlRegistry.has(normalizedUrl);
  },

  /**
   * Get the render type for a URL
   */
  getUrlType(url: string): 'media' | 'link' | 'text' | undefined {
    const normalizedUrl = normalizeUrl(url);
    return urlRegistry.get(normalizedUrl);
  },

  /**
   * Check if URL is registered as media
   */
  isUrlRegisteredAsMedia(url: string): boolean {
    const normalizedUrl = normalizeUrl(url);
    return urlRegistry.get(normalizedUrl) === 'media';
  },

  /**
   * Check if URL is registered as link
   */
  isUrlRegisteredAsLink(url: string): boolean {
    const normalizedUrl = normalizeUrl(url);
    return urlRegistry.get(normalizedUrl) === 'link';
  },

  /**
   * Clear specific URL from registry
   */
  clearUrl(url: string): void {
    const normalizedUrl = normalizeUrl(url);
    urlRegistry.delete(normalizedUrl);
  },

  /**
   * Clear all URLs from registry
   * Useful for cleanup between page navigations
   */
  clearAll(): void {
    urlRegistry.clear();
    lastCleared = Date.now();
    console.log('URL registry cleared');
  },

  /**
   * Clear all URLs from registry if they're older than a certain time
   * Used to prevent memory leaks
   */
  clearStaleEntries(maxAgeMs: number = 5 * 60 * 1000): void {
    const now = Date.now();
    if (now - lastCleared > maxAgeMs) {
      urlRegistry.clear();
      lastCleared = now;
      console.log('URL registry cleared (stale entries)');
    }
  },

  /**
   * Filter an array of URLs to only those not already registered
   */
  filterUnregisteredUrls(urls: string[]): string[] {
    return urls.filter(url => !this.isUrlRegistered(url));
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
