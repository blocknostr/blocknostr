
import { nostrService } from './service';

interface SubscriptionOptions {
  filters: any[];
  onEvent: (event: any) => void;
  relays?: string[];
  autoRenew?: boolean;
  ttl?: number; // Time to live in seconds
}

/**
 * Manager for handling Nostr subscriptions
 * Provides automatic renewal capabilities for subscriptions
 */
export class SubscriptionManager {
  private subscriptions: Map<string, {
    options: SubscriptionOptions;
    startTime: number;
    expiryTime?: number;
  }> = new Map();
  
  private renewalInterval?: NodeJS.Timer;

  constructor() {
    // Set up a renewal check interval
    this.renewalInterval = setInterval(() => this.checkForRenewals(), 30000);
  }

  /**
   * Create a new subscription
   * @param options Subscription options
   * @returns Subscription ID
   */
  subscribe(options: SubscriptionOptions): string {
    // Create the subscription
    const subId = nostrService.subscribe(
      options.filters,
      options.onEvent,
      options.relays
    );
    
    // Store the subscription details
    this.subscriptions.set(subId, {
      options,
      startTime: Date.now(),
      expiryTime: options.ttl ? Date.now() + (options.ttl * 1000) : undefined
    });
    
    return subId;
  }

  /**
   * Unsubscribe from a subscription
   * @param subId Subscription ID
   */
  unsubscribe(subId: string): void {
    if (this.subscriptions.has(subId)) {
      nostrService.unsubscribe(subId);
      this.subscriptions.delete(subId);
    }
  }

  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll(): void {
    for (const subId of this.subscriptions.keys()) {
      nostrService.unsubscribe(subId);
    }
    this.subscriptions.clear();
  }

  /**
   * Check for subscriptions that need renewal and renew them
   */
  private checkForRenewals(): void {
    const now = Date.now();
    
    for (const [subId, sub] of this.subscriptions.entries()) {
      // Skip if not set to auto-renew or no expiry
      if (!sub.options.autoRenew || !sub.expiryTime) {
        continue;
      }
      
      // If expired or about to expire, renew
      if (sub.expiryTime - now < 10000) { // Renew if less than 10s remaining
        this.renewSubscription(subId);
      }
    }
  }

  /**
   * Manually renew a subscription
   * @param subId Subscription ID
   * @returns Boolean indicating success
   */
  renewSubscription(subId: string): boolean {
    const sub = this.subscriptions.get(subId);
    if (!sub) {
      return false;
    }
    
    // Unsubscribe from the old subscription
    nostrService.unsubscribe(subId);
    
    // Create a new subscription with the same options
    const newSubId = nostrService.subscribe(
      sub.options.filters,
      sub.options.onEvent,
      sub.options.relays
    );
    
    // Update the subscription details
    this.subscriptions.delete(subId);
    this.subscriptions.set(newSubId, {
      options: sub.options,
      startTime: Date.now(),
      expiryTime: sub.options.ttl ? Date.now() + (sub.options.ttl * 1000) : undefined
    });
    
    return true;
  }

  /**
   * Clean up resources when manager is no longer needed
   */
  cleanup(): void {
    if (this.renewalInterval) {
      clearInterval(this.renewalInterval);
    }
    this.unsubscribeAll();
  }
}

// Can create a singleton instance if needed
// export const subscriptionManager = new SubscriptionManager();
