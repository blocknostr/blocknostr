
import { SimplePool } from 'nostr-tools';
import { NostrEvent, SubscriptionObject } from './types';

export class SubscriptionManager {
  private subscriptions: Map<string, Set<(event: NostrEvent) => void>> = new Map();
  private pool: SimplePool;
  
  constructor(pool: SimplePool) {
    this.pool = pool;
  }
  
  subscribe(
    relays: string[],
    filters: { kinds?: number[], authors?: string[], since?: number, limit?: number, ids?: string[], '#p'?: string[], '#e'?: string[] }[],
    onEvent: (event: NostrEvent) => void
  ): SubscriptionObject {
    const subId = `sub_${Math.random().toString(36).substr(2, 9)}`;
    
    this.subscriptions.set(subId, new Set([onEvent]));
    
    // Use the pool to subscribe
    const sub = this.pool.subscribeMany(
      relays,
      filters,
      {
        onevent: (event) => {
          const callbacks = this.subscriptions.get(subId);
          if (callbacks) {
            callbacks.forEach(cb => cb(event));
          }
        }
      }
    );
    
    // Return an object with the subscription and a function to unsubscribe
    return {
      subscription: sub,
      unsubscribe: () => {
        this.unsubscribe(subId);
        sub.close(); // Use close() instead of unsubscribe()
      }
    };
  }
  
  unsubscribe(subId: string): void {
    this.subscriptions.delete(subId);
  }
}
