/**
 * Utility to manage localStorage quota and prevent errors
 */
export class StorageQuotaManager {
  private static instance: StorageQuotaManager;
  private storageLimit: number;
  private storageWarningThreshold: number;
  private itemSizeLimit: number;
  
  private constructor() {
    // Set initial limits (5MB total, 1MB per item, warn at 80%)
    this.storageLimit = 5 * 1024 * 1024; // 5MB default limit
    this.storageWarningThreshold = 0.8; // 80%
    this.itemSizeLimit = 1 * 1024 * 1024; // 1MB per item
    
    // Try to determine actual storage limit
    this.estimateStorageLimit();
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(): StorageQuotaManager {
    if (!StorageQuotaManager.instance) {
      StorageQuotaManager.instance = new StorageQuotaManager();
    }
    return StorageQuotaManager.instance;
  }
  
  /**
   * Estimate storage limit based on browser
   */
  private estimateStorageLimit(): void {
    // Different browsers have different limits
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome')) {
      this.storageLimit = 5 * 1024 * 1024; // Chrome: ~5MB
    } else if (userAgent.includes('firefox')) {
      this.storageLimit = 10 * 1024 * 1024; // Firefox: ~10MB
    } else if (userAgent.includes('safari')) {
      this.storageLimit = 5 * 1024 * 1024; // Safari: ~5MB
    } else if (userAgent.includes('edge')) {
      this.storageLimit = 5 * 1024 * 1024; // Edge: ~5MB
    }
  }
  
  /**
   * Get the estimated current usage of localStorage
   */
  getCurrentUsage(): number {
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i) || '';
        const value = localStorage.getItem(key) || '';
        total += key.length + value.length;
      }
      return total;
    } catch (error) {
      console.error("Error calculating storage usage:", error);
      return 0;
    }
  }
  
  /**
   * Get the size of a string in bytes
   */
  getItemSize(value: string): number {
    return value.length * 2; // Approximation for UTF-16
  }
  
  /**
   * Check if setting an item would exceed quota
   */
  wouldExceedQuota(key: string, value: string): boolean {
    const currentUsage = this.getCurrentUsage();
    const newItemSize = this.getItemSize(key + value);
    const existingItemSize = localStorage.getItem(key) ? 
      this.getItemSize(key + (localStorage.getItem(key) || '')) : 0;
    
    // Calculate net change in size
    const netChange = newItemSize - existingItemSize;
    
    return (currentUsage + netChange) > this.storageLimit;
  }
  
  /**
   * Check if we're approaching the quota
   */
  isApproachingQuota(): boolean {
    const currentUsage = this.getCurrentUsage();
    return (currentUsage > this.storageLimit * this.storageWarningThreshold);
  }
  
  /**
   * Safe version of localStorage.setItem that won't throw quota errors
   */
  safeSetItem(key: string, value: string): boolean {
    try {
      // Check if item is too large
      if (this.getItemSize(value) > this.itemSizeLimit) {
        console.warn(`Item '${key}' exceeds single item size limit`);
        return false;
      }
      
      // Try to set the item
      localStorage.setItem(key, value);
      return true;
    } catch (error: any) {
      // Handle quota errors
      if (error.name === 'QuotaExceededError' || 
          error.message?.includes('quota') || 
          error.message?.includes('storage')) {
        console.warn(`Storage quota exceeded for '${key}'`);
        this.clearSpaceIfNeeded();
        return false;
      }
      
      console.error(`Error setting item '${key}':`, error);
      return false;
    }
  }
  
  /**
   * Clear space when approaching quota
   */
  clearSpaceIfNeeded(): void {
    if (!this.isApproachingQuota()) {
      return;
    }
    
    console.warn("Storage approaching quota, clearing cached data...");
    
    // Strategy: Clear oldest or least important items first
    // Get a list of cache-related keys
    const cacheKeys: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('cache') || key.includes('nostr_cached'))) {
        cacheKeys.push(key);
      }
    }
    
    // Sort by importance/naming and delete lower priority items
    cacheKeys.sort((a, b) => {
      // Keep important caches, delete regular caches first
      if (a.includes('important') && !b.includes('important')) return 1;
      if (!a.includes('important') && b.includes('important')) return -1;
      return a.localeCompare(b);
    });
    
    // Remove up to half the cache keys
    const keysToDelete = cacheKeys.slice(0, Math.ceil(cacheKeys.length / 2));
    keysToDelete.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.warn(`Cleared cache item: ${key}`);
      } catch (e) {
        console.error(`Failed to clear cache item: ${key}`, e);
      }
    });
  }
}

// Export singleton instance
export const storageQuota = StorageQuotaManager.getInstance();

/**
 * Helper function to safely set localStorage items
 */
export function safeLocalStorage(key: string, value: string): boolean {
  return storageQuota.safeSetItem(key, value);
}
