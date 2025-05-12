import { cacheManager } from './cacheManager';
import { contentCache } from '@/lib/nostr/cache/content-cache';

/**
 * Service responsible for clearing various caches in the application
 * Used for cache invalidation during version control operations or manual triggers
 */
export const cacheClearingService = {
  /**
   * Clear all application caches
   * @param showToast Whether to show a toast notification (default: false)
   */
  clearAllCaches: () => {
    console.log("🧹 Clearing all application caches");
    
    // Clear the general cache manager
    cacheManager.clear();
    
    // Clear Nostr content cache using public methods
    contentCache.clearAll();
    
    // Log completion
    console.log("✅ All caches cleared");
  },
  
  /**
   * Clear only runtime caches (memory-only, not persistent storage)
   */
  clearRuntimeCaches: () => {
    console.log("🧹 Clearing runtime caches only");
    
    // Clear the general cache manager (in-memory)
    cacheManager.clear();
    
    // Other runtime-only caches
    
    console.log("✅ Runtime caches cleared");
  },
  
  /**
   * Clear profile-related caches only
   * @param pubkey Optional specific public key to clear cache for
   */
  clearProfileCaches: (pubkey?: string) => {
    console.log("🧹 Clearing profile caches");
    
    if (pubkey) {
      // Only clear specific profile
      const profile = contentCache.getProfile(pubkey);
      if (profile) {
        contentCache.cacheProfile(pubkey, null); // Remove specific profile
        console.log(`✅ Cleared cache for profile: ${pubkey.substring(0, 8)}...`);
      }
    } else {
      // Force refresh all profiles on next fetch
      // This uses the public method to invalidate the profile cache
      contentCache.cleanupExpiredEntries();
      console.log("✅ Invalidated all profile caches");
    }
  },
};
