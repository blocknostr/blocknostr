/**
 * Utility to manage localStorage quota and prevent errors
 * Optimized for more aggressive cleanup and quota management
 */
export class StorageQuotaManager {
  private static instance: StorageQuotaManager;
  private storageLimit: number;
  private itemSizeLimit: number;
  private storageWarningLevels: {low: number, medium: number, high: number};
  
  private constructor() {
    // Set initial limits (5MB total, 1MB per item)
    this.storageLimit = 5 * 1024 * 1024; // 5MB default limit
    this.itemSizeLimit = 1 * 1024 * 1024; // 1MB per item
    
    // Warning thresholds (% of storage limit)
    this.storageWarningLevels = {
      low: 60,    // 60% - start light optimization
      medium: 75, // 75% - more aggressive cleanup
      high: 85    // 85% - emergency cleanup
    };
    
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
   * @param thresholdPercentage Warning threshold percentage (0-100)
   */
  async isApproachingQuota(thresholdPercentage: number = 70): Promise<boolean> {
    const currentUsage = this.getCurrentUsage();
    const threshold = (thresholdPercentage / 100) * this.storageLimit;
    return currentUsage > threshold;
  }
  
  /**
   * Get current quota usage as a percentage
   */
  async getQuotaPercentage(): Promise<number> {
    const currentUsage = this.getCurrentUsage();
    return Math.round((currentUsage / this.storageLimit) * 100);
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
    this.getQuotaPercentage().then(percentage => {
      if (percentage < this.storageWarningLevels.low) {
        return; // No cleanup needed
      }

      console.warn(`Storage usage at ${percentage}%, clearing cached data...`);
      
      // Strategy based on severity
      if (percentage >= this.storageWarningLevels.high) {
        // Aggressive cleanup for high storage usage
        this.emergencyStorageCleanup();
      } else if (percentage >= this.storageWarningLevels.medium) {
        // Standard cleanup for medium storage usage
        this.standardStorageCleanup();
      } else {
        // Light cleanup for low storage usage
        this.lightStorageCleanup();
      }
    }).catch(err => {
      console.error("Error checking quota percentage:", err);
    });
  }
  
  /**
   * Light cleanup for low storage pressure
   */
  private lightStorageCleanup(): void {
    // Clear temporary caches first
    const tempKeys: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('temp') || key.includes('scratch'))) {
        tempKeys.push(key);
      }
    }
    
    // Remove temp keys
    tempKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log(`[Light Cleanup] Cleared temp item: ${key}`);
      } catch (e) {
        console.error(`Failed to clear temp item: ${key}`, e);
      }
    });
    
    console.log(`[Light Cleanup] Removed ${tempKeys.length} temporary items`);
  }
  
  /**
   * Standard cleanup for medium storage pressure
   */
  private standardStorageCleanup(): void {
    // Clear standard cache items but leave important ones
    const cacheKeys: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('cache') && !key.includes('important')) {
        cacheKeys.push(key);
      }
    }
    
    // Sort by name for consistent deletion
    cacheKeys.sort();
    
    // Remove up to half the cache keys
    const keysToDelete = cacheKeys.slice(0, Math.ceil(cacheKeys.length / 2));
    keysToDelete.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log(`[Standard Cleanup] Cleared cache item: ${key}`);
      } catch (e) {
        console.error(`Failed to clear cache item: ${key}`, e);
      }
    });
    
    console.warn(`[Standard Cleanup] Removed ${keysToDelete.length} cache items out of ${cacheKeys.length} total`);
  }
  
  /**
   * Emergency cleanup for high storage pressure
   */
  private emergencyStorageCleanup(): void {
    // Aggressive cleanup - remove all non-essential data
    console.warn("[Emergency Cleanup] Performing aggressive storage cleanup");
    
    // Track what's deleted
    let deletedCount = 0;
    let errorCount = 0;
    
    // Identify keys by priority
    const lowPriorityKeys: string[] = [];
    const mediumPriorityKeys: string[] = [];
    const highPriorityKeys: string[] = [];
    
    // Categorize keys by priority
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      if (key.includes('important') || key.includes('settings') || key.includes('credentials')) {
        // High priority - keep these if possible
        highPriorityKeys.push(key);
      } else if (key.includes('profile') || key.includes('user')) {
        // Medium priority 
        mediumPriorityKeys.push(key);
      } else {
        // Low priority - delete these first
        lowPriorityKeys.push(key);
      }
    }
    
    // Delete low priority keys
    lowPriorityKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
        deletedCount++;
      } catch (e) {
        errorCount++;
      }
    });
    
    // If still above high threshold, delete medium priority keys
    this.getQuotaPercentage().then(percentage => {
      if (percentage >= this.storageWarningLevels.high) {
        mediumPriorityKeys.forEach(key => {
          try {
            localStorage.removeItem(key);
            deletedCount++;
          } catch (e) {
            errorCount++;
          }
        });
      }
      
      console.warn(`[Emergency Cleanup] Removed ${deletedCount} items, ${errorCount} errors`);
      
      // Log final storage state
      this.logStorageMetrics();
    }).catch(err => {
      console.error("Error checking quota after cleanup:", err);
    });
  }
  
  /**
   * Log storage metrics for monitoring
   */
  async logStorageMetrics(): Promise<void> {
    try {
      const usage = this.getCurrentUsage();
      const percentage = Math.round((usage / this.storageLimit) * 100);
      
      console.log(
        `Storage usage: ${(usage / 1024).toFixed(2)} KB / ${(this.storageLimit / 1024).toFixed(2)} KB (${percentage}%)`
      );
      
      // Count total items
      let cachesCount = 0;
      let nostrCount = 0;
      let otherCount = 0;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        if (key.includes('cache')) {
          cachesCount++;
        } else if (key.includes('nostr')) {
          nostrCount++;
        } else {
          otherCount++;
        }
      }
      
      console.log(`Storage items: ${cachesCount} caches, ${nostrCount} nostr, ${otherCount} other`);
      
      // Warning if approaching quota
      if (percentage >= this.storageWarningLevels.high) {
        console.warn(`CRITICAL: Storage usage very high at ${percentage}%`);
      } else if (percentage >= this.storageWarningLevels.medium) {
        console.warn(`WARNING: Storage usage high at ${percentage}%`);
      }
    } catch (err) {
      console.error("Error logging storage metrics:", err);
    }
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
