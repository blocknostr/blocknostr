
/**
 * Global subscription tracker to prevent memory leaks
 * Based on iris.to implementation patterns
 */
export class SubscriptionTracker {
  private static instance: SubscriptionTracker;
  private subscriptions: Map<string, {
    cleanup: () => void,
    createdAt: number,
    componentId: string
  }> = new Map();
  
  private constructor() {
    // Set up periodic subscription cleanup
    setInterval(() => this.checkForStalledSubscriptions(), 30000); // Run every 30 seconds
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
   */
  public register(id: string, cleanup: () => void, componentId: string): void {
    this.subscriptions.set(id, {
      cleanup,
      createdAt: Date.now(),
      componentId
    });
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
      this.subscriptions.delete(id);
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
    
    console.log(`Cleaning up ${subscriptionsToClean.length} subscriptions for component: ${componentId}`);
    
    // Cleanup each subscription
    subscriptionsToClean.forEach(([id, details]) => {
      try {
        details.cleanup();
      } catch (error) {
        console.error(`Error cleaning up subscription ${id} for component ${componentId}:`, error);
      }
      this.subscriptions.delete(id);
    });
  }
  
  /**
   * Get subscription count
   */
  public getCount(): number {
    return this.subscriptions.size;
  }
  
  /**
   * Check for stalled subscriptions (running too long)
   */
  private checkForStalledSubscriptions(): void {
    const now = Date.now();
    const MAX_AGE = 5 * 60 * 1000; // 5 minutes
    
    // Find subscriptions that have been active too long
    const stalledSubscriptions = Array.from(this.subscriptions.entries())
      .filter(([_, details]) => (now - details.createdAt) > MAX_AGE);
    
    if (stalledSubscriptions.length > 0) {
      console.warn(`Found ${stalledSubscriptions.length} stalled subscriptions. Cleaning up.`);
      
      stalledSubscriptions.forEach(([id, details]) => {
        console.warn(`Cleaning up stalled subscription ${id} from component ${details.componentId}`);
        this.unregister(id);
      });
    }
  }
  
  /**
   * Clean up all subscriptions - use during app shutdown
   */
  public cleanupAll(): void {
    console.log(`Cleaning up all ${this.subscriptions.size} subscriptions`);
    
    this.subscriptions.forEach((details, id) => {
      try {
        details.cleanup();
      } catch (error) {
        console.error(`Error cleaning up subscription ${id}:`, error);
      }
    });
    
    this.subscriptions.clear();
  }
}
