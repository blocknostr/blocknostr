
import { SimplePool } from 'nostr-tools';
import { NostrEvent, SubCloser } from './types';

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
  ): SubCloser {
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
    
    // Return a function that can be used to unsubscribe
    return () => {
      this.unsubscribe(subId);
      sub.close();
    };
  }
  
  unsubscribe(subId: string): void {
    this.subscriptions.delete(subId);
  }
}
