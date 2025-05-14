import { SimplePool } from 'nostr-tools';
import { NostrEvent, NostrFilter } from './types';
import { SubscriptionTracker } from './subscription-tracker';
import { ConnectionPool } from './relay/connection-pool';
import { v4 as uuidv4 } from 'uuid';

interface SubscriptionDetails {
  relays: string[];
  filters: NostrFilter[];
  subClosers: any[];
  createdAt: number;
  expiresAt: number | null;
  isRenewable: boolean;
  componentId: string;
}

export class SubscriptionManager {
  private pool: SimplePool;
  private subscriptions: Map<string, SubscriptionDetails> = new Map();
  private nextId = 0;
  private tracker: SubscriptionTracker;
  private connectionPool: ConnectionPool;
  
  // Default TTL is 15 minutes
  private defaultTTL: number = 15 * 60 * 1000;
  
  // Cleanup interval (every 60 seconds)
  private cleanupInterval: number;
  
  constructor(pool: SimplePool) {
    this.pool = pool;
    this.tracker = SubscriptionTracker.getInstance();
    this.connectionPool = ConnectionPool.getInstance();
    
    // Set up periodic cleanup for expired subscriptions
    this.cleanupInterval = window.setInterval(() => {
      this.cleanupExpiredSubscriptions();
    }, 60 * 1000);
  }
  
  /**
   * Subscribe to events with optional TTL
   * @param relays Relay URLs to subscribe to
   * @param filters Event filters to match
   * @param onEvent Callback function for matched events
   * @param options Additional subscription options
   * @returns Subscription ID string
   */
  subscribe(
    relays: string[],
    filters: NostrFilter[],
    onEvent: (event: NostrEvent) => void,
    options: {
      ttl?: number | null;  // Time-to-live in milliseconds, null for indefinite
      isRenewable?: boolean;  // Whether this subscription should be auto-renewed
      componentId?: string;  // Identifier for the component creating this subscription
    } = {}
  ): string {
    if (relays.length === 0) {
      console.error("No relays provided for subscription");
      return "";
    }
    
    if (filters.length === 0) {
      console.error("No filters provided for subscription");
      return "";
    }
    
    const id = `sub_${this.nextId++}_${uuidv4().slice(0, 8)}`;
    const now = Date.now();
    const componentId = options.componentId || 'unknown';
    
    try {
      // First connect to relays we need
      this.connectionPool.connectToRelays(relays).catch(err => {
        console.error("Error connecting to relays:", err);
      });
      
      // Use the pool instance from connection pool
      const poolInstance = this.connectionPool.getPool();
      
      // SimplePool.subscribe expects a single filter
      // We'll create multiple subscriptions, one for each filter
      const subClosers = filters.map(filter => {
        return poolInstance.subscribe(relays, filter, {
          onevent: (event) => {
            onEvent(event as NostrEvent);
          }
        });
      });
      
      // Calculate expiration time if TTL is provided
      const expiresAt = options.ttl !== null 
        ? now + (options.ttl || this.defaultTTL)
        : null;
      
      // Store subscription details for later unsubscribe
      this.subscriptions.set(id, {
        relays,
        filters,
        subClosers,
        createdAt: now,
        expiresAt,
        isRenewable: !!options.isRenewable,
        componentId
      });
      
      // Register with the tracker
      this.tracker.register(id, () => this.unsubscribe(id), componentId);
      
      return id;
    } catch (error) {
      console.error("Error creating subscription:", error);
      return "";
    }
  }
  
  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(subId: string): void {
    const subscription = this.subscriptions.get(subId);
    if (subscription) {
      try {
        // Close all subscriptions
        subscription.subClosers.forEach(closer => {
          if (closer && typeof closer.close === 'function') {
            closer.close();
          }
        });
        this.subscriptions.delete(subId);
        
        // Also unregister from tracker
        this.tracker.unregister(subId);
      } catch (error) {
        console.error(`Error unsubscribing from ${subId}:`, error);
      }
    }
  }
  
  /**
   * Clean up all subscriptions for a specific component
   */
  cleanupForComponent(componentId: string): void {
    // Find all subscriptions for this component
    const componentSubs = Array.from(this.subscriptions.entries())
      .filter(([_, details]) => details.componentId === componentId)
      .map(([id]) => id);
    
    // Unsubscribe from each one
    componentSubs.forEach(id => this.unsubscribe(id));
    
    // Also ask the tracker to clean up (as a safety measure)
    this.tracker.cleanupForComponent(componentId);
  }
  
  /**
   * Renew a subscription by extending its TTL
   */
  renewSubscription(subId: string, ttl?: number): boolean {
    const subscription = this.subscriptions.get(subId);
    if (!subscription) return false;
    
    // Calculate new expiration time
    const newExpiresAt = Date.now() + (ttl || this.defaultTTL);
    
    // Update the subscription details
    this.subscriptions.set(subId, {
      ...subscription,
      expiresAt: newExpiresAt
    });
    
    return true;
  }
  
  /**
   * Clean up expired subscriptions
   */
  private cleanupExpiredSubscriptions(): void {
    const now = Date.now();
    const expiredIds: string[] = [];
    const renewableIds: string[] = [];
    
    // Find expired subscriptions
    this.subscriptions.forEach((details, id) => {
      if (details.expiresAt && now >= details.expiresAt) {
        if (details.isRenewable) {
          renewableIds.push(id);
        } else {
          expiredIds.push(id);
        }
      }
    });
    
    // Unsubscribe expired subscriptions
    expiredIds.forEach(id => {
      console.log(`Cleaning up expired subscription: ${id}`);
      this.unsubscribe(id);
    });
    
    // Renew renewable subscriptions
    renewableIds.forEach(id => {
      console.log(`Renewing subscription: ${id}`);
      this.renewSubscription(id);
    });
  }
  
  /**
   * Check if a subscription exists
   */
  hasSubscription(subId: string): boolean {
    return this.subscriptions.has(subId);
  }
  
  /**
   * Get all active subscription IDs
   */
  getActiveSubscriptionIds(): string[] {
    return Array.from(this.subscriptions.keys());
  }
  
  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll(): void {
    this.getActiveSubscriptionIds().forEach(id => this.unsubscribe(id));
  }
  
  /**
   * Get count of active subscriptions
   */
  getActiveSubscriptionCount(): number {
    return this.subscriptions.size;
  }
  
  /**
   * Get subscription age in milliseconds
   */
  getSubscriptionAge(subId: string): number | null {
    const subscription = this.subscriptions.get(subId);
    if (!subscription) return null;
    
    return Date.now() - subscription.createdAt;
  }
  
  /**
   * Get subscription details
   */
  getSubscriptionDetails(subId: string): SubscriptionDetails | null {
    return this.subscriptions.get(subId) || null;
  }
  
  /**
   * Get subscription time remaining in milliseconds
   */
  getSubscriptionTimeRemaining(subId: string): number | null {
    const subscription = this.subscriptions.get(subId);
    if (!subscription || !subscription.expiresAt) return null;
    
    const remaining = subscription.expiresAt - Date.now();
    return Math.max(0, remaining);
  }
  
  /**
   * Set the default TTL for subscriptions
   */
  setDefaultTTL(ttlMs: number): void {
    this.defaultTTL = ttlMs;
  }
  
  /**
   * Clean up resources when the manager is no longer needed
   */
  dispose(): void {
    // Clear the cleanup interval
    clearInterval(this.cleanupInterval);
    
    // Unsubscribe from all subscriptions
    this.unsubscribeAll();
  }
}
