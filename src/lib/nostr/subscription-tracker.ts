/**
 * Global subscription tracker to prevent memory leaks
 * Based on iris.to implementation patterns with enhanced memory management
 */
export class SubscriptionTracker {
  private static instance: SubscriptionTracker;
  private subscriptions: Map<string, {
    cleanup: () => void,
    createdAt: number,
    componentId: string,
    category?: string,
    priority?: number
  }> = new Map();
  
  // Global subscription limits
  private readonly MAX_SUBSCRIPTIONS = 75;
  private readonly WARNING_THRESHOLD = 0.8; // 80% of max
  private readonly WARNING_INTERVAL = 10000; // 10 seconds between warnings
  private lastWarningTime = 0;
  
  // Timeouts in milliseconds
  private readonly DEFAULT_MAX_AGE = 5 * 60 * 1000; // 5 minutes
  private readonly PROFILE_MAX_AGE = 2 * 60 * 1000; // 2 minutes for profile data
  private readonly RELAY_MAX_AGE = 30 * 1000; // 30 seconds for relay checks
  
  // Category-specific limits
  private readonly CATEGORY_LIMITS: Record<string, number> = {
    profile: 20,
    feed: 10,
    chat: 5,
    relay: 10
  };
  
  // Component subscription tracking
  private componentSubscriptionCounts: Map<string, number> = new Map();
  private readonly MAX_PER_COMPONENT = 15;
  
  // Performance tracking
  private creationRateData: {componentId: string, timestamp: number}[] = [];
  private readonly RATE_WINDOW_SIZE = 60000; // 1 minute window
  private readonly MAX_CREATION_RATE = 30; // Max 30 subs per minute
  
  private constructor() {
    // Set up periodic subscription cleanup
    setInterval(() => this.checkForStalledSubscriptions(), 15000); // Run every 15 seconds
    
    // Set up periodic performance check
    setInterval(() => this.checkSubscriptionCreationRate(), 30000); // Every 30 seconds
    
    // Log current subscription state periodically in development
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => this.logSubscriptionState(), 60000); // Every minute
    }
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): SubscriptionTracker {
    if (!SubscriptionTracker.instance) {
      SubscriptionTracker.instance = new SubscriptionTracker();
    }
    return SubscriptionTracker.instance;
  }
  
  /**
   * Register a new subscription
   * @param id Unique subscription identifier
   * @param cleanup Function to call when cleaning up subscription
   * @param componentId Identifier for the component that created this subscription
   * @param options Additional options like category and priority
   */
  public register(
    id: string, 
    cleanup: () => void, 
    componentId: string, 
    options: { 
      category?: 'profile' | 'feed' | 'chat' | 'relay' | 'other',
      priority?: number // 1 = highest, 10 = lowest
    } = {}
  ): void {
    // Check if we're reaching subscription limits and enforce cleanup if needed
    this.enforceSubscriptionLimits();
    
    // Check component-specific limits
    this.enforceComponentLimits(componentId);
    
    // Track the subscription creation rate
    this.trackSubscriptionCreation(componentId);
    
    // Register the subscription
    this.subscriptions.set(id, {
      cleanup,
      createdAt: Date.now(),
      componentId,
      category: options.category || 'other',
      priority: options.priority || 5 // Default to medium priority
    });
    
    // Update component subscription count
    const currentCount = this.componentSubscriptionCounts.get(componentId) || 0;
    this.componentSubscriptionCounts.set(componentId, currentCount + 1);
    
    // Log useful debugging info
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[SubscriptionTracker] Registered subscription ${id.slice(0, 8)} ` +
        `for component ${componentId} (${this.getCount()} total)`
      );
    }
  }
  
  /**
   * Unregister a subscription
   * @param id Subscription identifier
   */
  public unregister(id: string): void {
    const subscription = this.subscriptions.get(id);
    if (subscription) {
      try {
        subscription.cleanup();
      } catch (error) {
        console.error(`Error cleaning up subscription ${id}:`, error);
      }
      
      // Update component subscription count
      const componentId = subscription.componentId;
      const currentCount = this.componentSubscriptionCounts.get(componentId) || 0;
      this.componentSubscriptionCounts.set(componentId, Math.max(0, currentCount - 1));
      
      // Remove the subscription
      this.subscriptions.delete(id);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[SubscriptionTracker] Unregistered subscription ${id.slice(0, 8)} ` +
          `from component ${componentId} (${this.getCount()} remaining)`
        );
      }
    }
  }
  
  /**
   * Cleanup all subscriptions for a component
   * @param componentId Component identifier
   */
  public cleanupForComponent(componentId: string): void {
    // Find all subscriptions for this component
    const subscriptionsToClean = Array.from(this.subscriptions.entries())
      .filter(([_, details]) => details.componentId === componentId);
    
    const count = subscriptionsToClean.length;
    console.log(`[SubscriptionTracker] Cleaning up ${count} subscriptions for component: ${componentId}`);
    
    // Cleanup each subscription
    subscriptionsToClean.forEach(([id, details]) => {
      try {
        details.cleanup();
      } catch (error) {
        console.error(`Error cleaning up subscription ${id} for component ${componentId}:`, error);
      }
      this.subscriptions.delete(id);
    });
    
    // Reset component subscription count
    this.componentSubscriptionCounts.set(componentId, 0);
  }
  
  /**
   * Get subscription count
   */
  public getCount(): number {
    return this.subscriptions.size;
  }
  
  /**
   * Get count of subscriptions by category
   */
  public getCountByCategory(): Record<string, number> {
    const counts: Record<string, number> = {};
    this.subscriptions.forEach((details) => {
      const category = details.category || 'other';
      counts[category] = (counts[category] || 0) + 1;
    });
    return counts;
  }
  
  /**
   * Get count of subscriptions by component
   */
  public getCountByComponent(): Record<string, number> {
    const result: Record<string, number> = {};
    this.componentSubscriptionCounts.forEach((count, componentId) => {
      result[componentId] = count;
    });
    return result;
  }
  
  /**
   * Check for stalled subscriptions (running too long)
   */
  private checkForStalledSubscriptions(): void {
    const now = Date.now();
    
    // Group subscriptions by category to apply different timeouts
    const stalledSubscriptions = Array.from(this.subscriptions.entries())
      .filter(([_, details]) => {
        const category = details.category || 'other';
        let maxAge = this.DEFAULT_MAX_AGE;
        
        // Apply category-specific timeouts
        if (category === 'profile') maxAge = this.PROFILE_MAX_AGE;
        if (category === 'relay') maxAge = this.RELAY_MAX_AGE;
        
        return (now - details.createdAt) > maxAge;
      });
    
    if (stalledSubscriptions.length > 0) {
      console.warn(`[SubscriptionTracker] Found ${stalledSubscriptions.length} stalled subscriptions. Cleaning up.`);
      
      stalledSubscriptions.forEach(([id, details]) => {
        console.warn(`[SubscriptionTracker] Cleaning up stalled subscription ${id.slice(0, 8)} from component ${details.componentId}`);
        this.unregister(id);
      });
    }
  }
  
  /**
   * Enforce global subscription limits
   * Will clean up low-priority subscriptions if approaching limit
   */
  private enforceSubscriptionLimits(): void {
    const currentCount = this.getCount();
    
    // Check if we're approaching the warning threshold
    if (currentCount >= this.MAX_SUBSCRIPTIONS * this.WARNING_THRESHOLD) {
      const now = Date.now();
      
      // Only show warning periodically to avoid console spam
      if (now - this.lastWarningTime > this.WARNING_INTERVAL) {
        console.warn(
          `[SubscriptionTracker] WARNING: High subscription count (${currentCount}/${this.MAX_SUBSCRIPTIONS}). ` +
          `Performance may degrade.`
        );
        this.lastWarningTime = now;
      }
    }
    
    // If we're exceeding the limit, perform emergency cleanup
    if (currentCount >= this.MAX_SUBSCRIPTIONS) {
      console.warn(`[SubscriptionTracker] CRITICAL: Subscription limit exceeded (${currentCount}/${this.MAX_SUBSCRIPTIONS}). Performing emergency cleanup.`);
      this.performEmergencyCleanup();
    }
  }
  
  /**
   * Enforce component-specific subscription limits
   */
  private enforceComponentLimits(componentId: string): void {
    const currentCount = this.componentSubscriptionCounts.get(componentId) || 0;
    
    if (currentCount >= this.MAX_PER_COMPONENT) {
      console.warn(
        `[SubscriptionTracker] WARNING: Component ${componentId} has too many subscriptions (${currentCount}). ` +
        `Cleaning up oldest.`
      );
      
      // Find the oldest subscriptions from this component
      const componentSubs = Array.from(this.subscriptions.entries())
        .filter(([_, details]) => details.componentId === componentId)
        .sort((a, b) => a[1].createdAt - b[1].createdAt);
      
      // Clean up the oldest third of subscriptions
      const toRemove = Math.ceil(componentSubs.length / 3);
      componentSubs.slice(0, toRemove).forEach(([id]) => {
        this.unregister(id);
      });
    }
  }
  
  /**
   * Track subscription creation rate to detect potential issues
   */
  private trackSubscriptionCreation(componentId: string): void {
    this.creationRateData.push({
      componentId,
      timestamp: Date.now()
    });
    
    // Prune old data
    const now = Date.now();
    this.creationRateData = this.creationRateData.filter(
      data => (now - data.timestamp) < this.RATE_WINDOW_SIZE
    );
  }
  
  /**
   * Check if subscriptions are being created too quickly
   */
  private checkSubscriptionCreationRate(): void {
    const creationCount = this.creationRateData.length;
    
    if (creationCount > this.MAX_CREATION_RATE) {
      // Count by component to find the culprit
      const componentCounts: Record<string, number> = {};
      this.creationRateData.forEach(data => {
        componentCounts[data.componentId] = (componentCounts[data.componentId] || 0) + 1;
      });
      
      // Find the component creating the most subscriptions
      const entries = Object.entries(componentCounts);
      const worstOffender = entries.sort((a, b) => b[1] - a[1])[0];
      
      console.warn(
        `[SubscriptionTracker] WARNING: High subscription creation rate detected! ` +
        `${creationCount} in the last minute. ` +
        `Worst offender: ${worstOffender[0]} (${worstOffender[1]} subscriptions).`
      );
    }
  }
  
  /**
   * Clean up based on priority when reaching limits
   */
  private performEmergencyCleanup(): void {
    // Get all subscriptions sorted by priority (higher number = lower priority)
    const sortedSubscriptions = Array.from(this.subscriptions.entries())
      .sort((a, b) => {
        // Sort by priority first (higher number = lower priority)
        const priorityDiff = (b[1].priority || 5) - (a[1].priority || 5);
        if (priorityDiff !== 0) return priorityDiff;
        
        // Then sort by age (older first)
        return a[1].createdAt - b[1].createdAt;
      });
    
    // Remove about one-third of subscriptions
    const removeCount = Math.ceil(sortedSubscriptions.length / 3);
    const toRemove = sortedSubscriptions.slice(0, removeCount);
    
    console.warn(`[SubscriptionTracker] Emergency cleanup: removing ${removeCount} subscriptions`);
    
    toRemove.forEach(([id]) => {
      this.unregister(id);
    });
  }
  
  /**
   * Log current subscription state for debugging
   */
  private logSubscriptionState(): void {
    if (this.subscriptions.size === 0) return;
    
    console.log(`[SubscriptionTracker] Current state: ${this.subscriptions.size} active subscriptions`);
    
    // Log counts by category
    const categoryCounts = this.getCountByCategory();
    console.log('[SubscriptionTracker] By category:', categoryCounts);
    
    // Log top components by subscription count
    const componentCounts = this.getCountByComponent();
    const topComponents = Object.entries(componentCounts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    if (topComponents.length > 0) {
      console.log('[SubscriptionTracker] Top subscription creators:');
      topComponents.forEach(([componentId, count]) => {
        console.log(`  - ${componentId}: ${count} subscriptions`);
      });
    }
  }
  
  /**
   * Clean up all subscriptions - use during app shutdown
   */
  public cleanupAll(): void {
    console.log(`[SubscriptionTracker] Cleaning up all ${this.subscriptions.size} subscriptions`);
    
    this.subscriptions.forEach((details, id) => {
      try {
        details.cleanup();
      } catch (error) {
        console.error(`Error cleaning up subscription ${id}:`, error);
      }
    });
    
    this.subscriptions.clear();
    this.componentSubscriptionCounts.clear();
    this.creationRateData = [];
  }
  
  /**
   * Find and clean up duplicate subscriptions (same component and similar creation time)
   */
  public cleanupDuplicates(): number {
    const groupedByComponent: Record<string, Map<string, number[]>> = {};
    
    // Group subscriptions by component
    this.subscriptions.forEach((details, id) => {
      const { componentId } = details;
      if (!groupedByComponent[componentId]) {
        groupedByComponent[componentId] = new Map();
      }
      
      // We use a fuzzy time window for potential duplicates
      const timeWindow = Math.floor(details.createdAt / 1000);
      if (!groupedByComponent[componentId].has(String(timeWindow))) {
        groupedByComponent[componentId].set(String(timeWindow), []);
      }
      
      groupedByComponent[componentId].get(String(timeWindow))!.push(id);
    });
    
    let removedCount = 0;
    
    // Find potential duplicates (multiple subscriptions from same component in same second)
    Object.entries(groupedByComponent).forEach(([componentId, timeWindows]) => {
      timeWindows.forEach((subIds) => {
        // If we have multiple subscriptions in the same time window, keep only one
        if (subIds.length > 1) {
          // Keep the newest one
          const sorted = subIds.sort((a, b) => {
            return this.subscriptions.get(b)!.createdAt - this.subscriptions.get(a)!.createdAt;
          });
          
          // Remove all but the first one (newest)
          sorted.slice(1).forEach(id => {
            this.unregister(id);
            removedCount++;
          });
          
          if (removedCount > 0) {
            console.warn(
              `[SubscriptionTracker] Cleaned up ${removedCount} potential duplicate subscriptions ` +
              `from component ${componentId}`
            );
          }
        }
      });
    });
    
    return removedCount;
  }
  
  /**
   * Check if a component has too many subscriptions
   */
  public hasExcessiveSubscriptions(componentId: string): boolean {
    const count = this.componentSubscriptionCounts.get(componentId) || 0;
    return count > this.MAX_PER_COMPONENT;
  }
}
