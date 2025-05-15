import { SimplePool } from 'nostr-tools';

/**
 * Adapter for SimplePool that provides compatibility with older versions
 * or implements missing methods
 */
export class SimplePoolAdapter {
  private pool: SimplePool;
  
  constructor(pool: SimplePool) {
    this.pool = pool;
  }
  
  /**
   * Lists all relays in the pool
   * This is a compatibility method for older SimplePool.list() functionality
   * @returns Array of relay URLs
   */
  list(): string[] {
    // If the SimplePool has a native list method, use it
    if ('list' in this.pool && typeof this.pool.list === 'function') {
      return (this.pool as any).list();
    }
    
    // Otherwise return an empty array 
    // In newer nostr-tools, you'd typically track relays separately
    console.warn('SimplePool.list() is not available in this version of nostr-tools');
    return [];
  }
  
  /**
   * Get the underlying SimplePool instance
   */
  getPool(): SimplePool {
    return this.pool;
  }
}

/**
 * Creates a wrapped SimplePool with backward compatibility methods
 */
export function createPoolAdapter(pool: SimplePool = new SimplePool()): SimplePoolAdapter {
  return new SimplePoolAdapter(pool);
}
