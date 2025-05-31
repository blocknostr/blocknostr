import { SimplePool, type Filter } from 'nostr-tools';
import { NostrEvent, NostrFilter } from './types';

/**
 * Simplified Subscription Manager
 * Focuses on core functionality without over-engineering
 */
export class SubscriptionManager {
  private pool: SimplePool;
  private subscriptions: Map<string, () => void> = new Map();
  private nextId = 0;
  private debugMode = false;
  
  constructor(pool: SimplePool) {
    this.pool = pool;
  }
  
  /**
   * Create a subscription
   */
  subscribe(
    relays: string[],
    filters: NostrFilter[],
    onEvent: (event: NostrEvent) => void,
    options: {
      timeoutMs?: number;
    } = {}
  ): string {
    // Provide default relays if none are provided
    if (relays.length === 0) {
      relays = [
        'wss://relay.damus.io',
        'wss://nos.lol',
        'wss://relay.nostr.band',
        'wss://nostr.bitcoiner.social'
      ];
    }
    
    if (filters.length === 0) {
      console.error("No filters provided for subscription");
      return "";
    }
    
    const id = `sub_${this.nextId++}`;
    
    if (this.debugMode) {
      console.log(`[SubscriptionManager] Creating subscription ${id}`);
    }
    
    try {
      // Create subscription using SimplePool
      const sub = this.pool.subscribeMany(relays, filters, {
        onevent: (event) => {
          onEvent(event as NostrEvent);
        },
        oneose: () => {
          if (this.debugMode) {
            console.log(`[SubscriptionManager] Subscription ${id} reached end of stored events`);
          }
        }
      });
      
      // Store cleanup function
      this.subscriptions.set(id, () => {
        try {
          sub.close();
        } catch (error) {
          console.warn(`Error closing subscription ${id}:`, error);
        }
      });
      
      // Set up auto-close timeout if requested
      if (options.timeoutMs) {
        setTimeout(() => {
          this.unsubscribe(id);
        }, options.timeoutMs);
      }
      
      return id;
    } catch (error) {
      console.error("Error creating subscription:", error);
      return "";
    }
  }
  
  /**
   * Unsubscribe from a subscription
   */
  unsubscribe(subId: string): void {
    const cleanup = this.subscriptions.get(subId);
    if (cleanup) {
      cleanup();
      this.subscriptions.delete(subId);
      
      if (this.debugMode) {
        console.log(`[SubscriptionManager] Unsubscribed from ${subId}`);
      }
    }
  }
  
  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach((cleanup, id) => {
      try {
        cleanup();
      } catch (error) {
        console.warn(`Error cleaning up subscription ${id}:`, error);
      }
    });
    this.subscriptions.clear();
    
    if (this.debugMode) {
      console.log(`[SubscriptionManager] All subscriptions cleared`);
    }
  }
  
  /**
   * Get active subscription count
   */
  getActiveSubscriptionCount(): number {
    return this.subscriptions.size;
  }
  
  /**
   * Get subscription statistics
   */
  getSubscriptionStats(): { 
    active: number; 
    oldestId?: string;
  } {
    const stats = {
      active: this.subscriptions.size,
      oldestId: undefined as string | undefined
    };
    
    if (this.subscriptions.size > 0) {
      stats.oldestId = Array.from(this.subscriptions.keys())[0];
    }
    
    return stats;
  }
  
  /**
   * Enable/disable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    console.log(`[SubscriptionManager] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Check if subscription exists
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
}

