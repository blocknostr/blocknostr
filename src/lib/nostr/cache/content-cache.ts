import { BaseCache } from './base-cache';
import { threadCache } from './thread-cache';
import { CACHE_KEYS } from './config';
import { NostrEvent } from '../types';
import { getEventId } from '../utils/event-filter';

// Cache for storing parsed content to avoid redundant processing
class ContentCache extends BaseCache<string> {
  constructor() {
    super(CACHE_KEYS.CONTENT, { 
      maxSize: 500, 
      ttl: 1000 * 60 * 60 * 24 // 24 hours
    });

    // Set up periodic cleanup
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanupExpired(), 1000 * 60 * 10); // Every 10 minutes
    }
  }

  /**
   * Add content to cache with automatic expiry
   * @param key Cache key
   * @param value Content value
   */
  add(key: string, value: string): void {
    if (!key || !value) return;
    
    try {
      // Add to cache with timestamp for TTL tracking
      this.cache.set(key, {
        value,
        timestamp: Date.now(),
        accessed: Date.now(),
        accessCount: 0
      });
    } catch (error) {
      console.error('Error adding to content cache:', error);
    }
  }

  /**
   * Get formatted content from cache, tracking access
   * @param key Cache key
   */
  get(key: string): string | null {
    try {
      const item = this.cache.get(key);
      if (!item) return null;
      
      // Update access tracking
      item.accessed = Date.now();
      item.accessCount = (item.accessCount || 0) + 1;
      
      return item.value;
    } catch (error) {
      console.error('Error getting from content cache:', error);
      return null;
    }
  }

  /**
   * Clear all related thread content when a thread is processed
   * @param threadId The thread root ID
   */
  clearThreadContent(threadId: string): void {
    if (!threadId) return;
    
    try {
      // Clear cached content related to this thread
      const keysToDelete: string[] = [];
      
      this.cache.forEach((_, key) => {
        if (key.includes(threadId)) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => {
        this.cache.delete(key);
      });
      
      // Also clean up thread cache
      threadCache.cleanupThread(threadId);
    } catch (error) {
      console.error('Error clearing thread content:', error);
    }
  }

  /**
   * Generate cache key for content formatting
   * @param content Content to format
   * @param options Optional formatting options
   */
  getContentKey(content: string, options?: Record<string, any>): string {
    if (!content) return '';
    
    try {
      const optionsStr = options ? JSON.stringify(options) : '';
      return `content-${content.length}-${content.substring(0, 32).replace(/\s+/g, '')}-${optionsStr}`;
    } catch (error) {
      console.error('Error generating content cache key:', error);
      return `content-${Date.now()}-${Math.random()}`;
    }
  }

  /**
   * Generate cache key for event content formatting
   * @param event NostrEvent object
   */
  getEventContentKey(event: NostrEvent): string {
    if (!event || !event.id) return '';
    
    try {
      return `event-content-${event.id}-${event.created_at || 0}`;
    } catch (error) {
      console.error('Error generating event content cache key:', error);
      return '';
    }
  }

  /**
   * Mark a thread as important to prevent automatic cleanup
   * @param threadId Thread ID to mark as important
   */
  markThreadImportant(threadId: string): void {
    // Thread marking logic
  }
  
  /**
   * Perform cleanup of expired content
   */
  cleanupExpired(): void {
    try {
      const now = Date.now();
      const keysToDelete: string[] = [];
      
      this.cache.forEach((item, key) => {
        // Delete if TTL expired
        if (now - item.timestamp > this.options.ttl) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => {
        this.cache.delete(key);
      });
      
      console.log(`Content cache cleanup: Removed ${keysToDelete.length} items`);
    } catch (error) {
      console.error('Error during content cache cleanup:', error);
    }
  }

  /**
   * Perform cleanup based on access patterns
   */
  cleanupByAccessPattern(): void {
    try {
      const now = Date.now();
      const keysToDelete: string[] = [];
      
      // Define thresholds
      const accessThreshold = 1000 * 60 * 60 * 24 * 3; // 3 days
      
      this.cache.forEach((item, key) => {
        // Delete if not accessed recently
        if (now - item.accessed > accessThreshold) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => {
        this.cache.delete(key);
      });
      
      console.log(`Content cache access cleanup: Removed ${keysToDelete.length} items`);
    } catch (error) {
      console.error('Error during content cache access cleanup:', error);
    }
  }

  /**
   * Clean verified profile data status
   */
  clearVerifiedStatus(pubkey: string): void {
    try {
      if (!pubkey) return;
      
      const keysToDelete: string[] = [];
      
      this.cache.forEach((_, key) => {
        if (key.includes(`verified-${pubkey}`)) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => {
        this.cache.delete(key);
      });
    } catch (error) {
      console.error('Error clearing verified status:', error);
    }
  }
}

export const contentCache = new ContentCache();
