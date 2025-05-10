
import { SimplePool } from 'nostr-tools';
import { NostrEvent, SubCloser } from './types';

export class SubscriptionManager {
  private subscriptions: Map<string, Set<(event: NostrEvent) => void>> = new Map();
  private pool: SimplePool;
  private subClosers: Map<string, SubCloser> = new Map(); // Store SubCloser functions
  
  constructor(pool: SimplePool) {
    this.pool = pool;
  }
  
  subscribe(
    relays: string[],
    filters: { kinds?: number[], authors?: string[], since?: number, limit?: number, ids?: string[], '#p'?: string[], '#e'?: string[] }[],
    onEvent: (event: NostrEvent) => void
  ): string {
    const subId = `sub_${Math.random().toString(36).substr(2, 9)}`;
    
    this.subscriptions.set(subId, new Set([onEvent]));
    
    // Use the pool to subscribe
    const subCloser = this.pool.subscribeMany(
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
    
    // Store the closer function with the subId
    this.subClosers.set(subId, subCloser);
    
    return subId;
  }
  
  unsubscribe(subId: string): void {
    // Get and execute the closer function
    const closer = this.subClosers.get(subId);
    if (closer) {
      closer(); // Call the SubCloser function
    }
    
    // Clean up 
    this.subscriptions.delete(subId);
    this.subClosers.delete(subId);
  }
}
