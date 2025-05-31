import { toast } from "@/lib/toast";

interface StorageQuotaEstimate {
  quota: number;
  usage: number;
  available: number;
  percentUsed: number;
}

/**
 * Enhanced storage quota utility for improved caching behavior
 * and error handling in the Nostr client
 */
export const storageQuota = {
  /**
   * Check if browser supports the Storage API
   */
  isStorageAPISupported(): boolean {
    return 'storage' in navigator && 'estimate' in navigator.storage;
  },

  /**
   * Get estimated storage quota and usage
   */
  async getEstimate(): Promise<StorageQuotaEstimate | null> {
    if (!this.isStorageAPISupported()) {
      console.warn('Storage API not supported in this browser');
      return null;
    }

    try {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const usage = estimate.usage || 0;
      const available = quota - usage;
      const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

      return {
        quota,
        usage,
        available,
        percentUsed
      };
    } catch (error) {
      console.error('Error estimating storage quota:', error);
      return null;
    }
  },

  /**
   * Check if we're approaching quota limits
   * @param warningThreshold Percentage (0-100) at which to warn
   */
  async isApproachingQuota(warningThreshold: number = 80): Promise<boolean> {
    const estimate = await this.getEstimate();
    
    if (!estimate) {
      // If we can't estimate, assume we're not approaching quota
      return false;
    }

    return estimate.percentUsed > warningThreshold;
  },

  /**
   * Safely set item in storage with quota error handling
   */
  safeSetItem(key: string, value: string, storage: Storage = localStorage): boolean {
    try {
      storage.setItem(key, value);
      return true;
    } catch (error: any) {
      // Handle quota exceeded errors
      if (
        error.name === 'QuotaExceededError' ||
        error.code === 22 ||
        error.code === 1014 ||
        (error.message && error.message.includes('quota'))
      ) {
        console.warn(`Storage quota exceeded when setting ${key}`);
        
        // Try to clear some space
        this.clearSpace(storage);
        
        // Notify user about storage issues
        toast.warning("Storage space is limited. Some cached data was cleared.");
        
        return false;
      }
      
      console.error(`Error setting ${key} in storage:`, error);
      return false;
    }
  },

  /**
   * Clear space by removing old cached items
   */
  clearSpace(storage: Storage = localStorage): void {
    const keysToKeep: string[] = [];
    const keysToRemove: string[] = [];
    
    // Sort keys by importance
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (!key) continue;
      
      // Keep user profile data and important settings
      if (
        key.includes('user_') ||
        key.includes('preferences_') ||
        key.includes('settings_') ||
        key.includes('auth_')
      ) {
        keysToKeep.push(key);
      } 
      // Target cache items for removal
      else if (
        key.includes('cache_') ||
        key.includes('temp_') ||
        key.includes('events_') ||
        key.includes('feed_')
      ) {
        keysToRemove.push(key);
      }
    }
    
    // Remove up to 50% of removable keys, oldest first
    const removeCount = Math.ceil(keysToRemove.length * 0.5);
    
    // Sort by estimated age if timestamp is in the key
    keysToRemove.sort((a, b) => {
      const aMatch = a.match(/(\d+)/);
      const bMatch = b.match(/(\d+)/);
      
      if (aMatch && bMatch) {
        return Number(aMatch[1]) - Number(bMatch[1]);
      }
      return 0;
    });
    
    // Remove oldest keys
    keysToRemove.slice(0, removeCount).forEach(key => {
      try {
        storage.removeItem(key);
        console.log(`Removed cached item: ${key}`);
      } catch (e) {
        console.error(`Failed to remove ${key}:`, e);
      }
    });
    
    console.log(`Cleared ${removeCount}/${keysToRemove.length} cache items`);
  },
  
  /**
   * Log storage metrics
   */
  async logStorageMetrics(): Promise<void> {
    const estimate = await this.getEstimate();
    
    if (estimate) {
      console.log('Storage metrics:', {
        quota: this.formatBytes(estimate.quota),
        usage: this.formatBytes(estimate.usage),
        available: this.formatBytes(estimate.available),
        percentUsed: `${estimate.percentUsed.toFixed(1)}%`
      });
    } else {
      console.log('Storage metrics not available');
      
      // Fall back to localStorage length
      console.log(`LocalStorage items: ${localStorage.length}`);
    }
  },
  
  /**
   * Format bytes to human-readable format
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  }
};

/**
 * Helper function for safe storage operations
 */
export function safeStorage(key: string, value: string): boolean {
  return storageQuota.safeSetItem(key, value);
}

/**
 * Helper to estimate available cache space
 */
export async function checkCacheAvailability(): Promise<boolean> {
  return !(await storageQuota.isApproachingQuota(90));
}

