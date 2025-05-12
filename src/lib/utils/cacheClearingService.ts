import { cacheManager } from './cacheManager';
import { contentCache } from '@/lib/nostr/cache/content-cache';

/**
 * Service to handle cache clearing operations across the application
 * Used to keep application state clean during version control operations
 */
export const cacheClearingService = {
  /**
   * Clear all application caches (both memory and persistent)
   */
  clearAllCaches: () => {
    console.log("🧹 Clearing all application caches");
    
    // Clear the general cache manager
    cacheManager.clear();
    
    // Clear the Nostr content cache
    contentCache.clearAll();
    
    // Add any other cache clearing operations here
    
    // Clear localStorage items that might be stale
    // Being selective to avoid clearing auth tokens or other critical data
    const keysToPreserve = ['nostr_keypair', 'auth_token', 'theme_preference'];
    
    // Get all keys that don't need to be preserved
    const keysToRemove = Object.keys(localStorage).filter(
      key => !keysToPreserve.includes(key) && key.startsWith('nostr_') || key.includes('cache')
    );
    
    // Remove the filtered keys
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log(`✅ All caches cleared (preserved ${keysToPreserve.length} critical items)`);
    
    // Return success indicator
    return true;
  },
  
  /**
   * Clear only runtime caches (memory-only, not persistent storage)
   * Useful for refreshing data without losing user settings
   */
  clearRuntimeCaches: () => {
    console.log("🧹 Clearing runtime caches only");
    
    // Clear specific cache components but keep persistent storage
    contentCache.eventCache.cleanupExpiredEntries();
    contentCache.profileCache.cleanupExpiredEntries();
    contentCache.threadCache.cleanupExpiredEntries();
    contentCache.feedCache.cleanupExpiredEntries();
    
    // Force immediate garbage collection of memory caches
    cacheManager.clear();
    
    console.log("✅ Runtime caches cleared");
    
    // Return success indicator
    return true;
  }
};
