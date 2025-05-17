
// Simple cache for DAOs to reduce duplicate network requests
// and improve performance

import { DAO } from "@/types/dao";

class DAOCache {
  private cache: Map<string, { data: DAO; timestamp: number }> = new Map();
  private TTL = 5 * 60 * 1000; // 5 minutes TTL
  
  async getItem<T>(key: string, fetchCallback: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(key);
    
    // Return from cache if it exists and isn't expired
    if (cached && now - cached.timestamp < this.TTL) {
      return cached.data as unknown as T;
    }
    
    // Fetch new data
    const data = await fetchCallback();
    
    // Store in cache (if not null)
    if (data !== null) {
      this.cache.set(key, { data: data as unknown as DAO, timestamp: now });
    }
    
    return data;
  }
  
  clearItem(key: string): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      console.log(`Cleared cache for DAO: ${key}`);
    }
  }
  
  clearAll(): void {
    console.log(`Cleared all DAO cache entries (${this.cache.size} entries)`);
    this.cache.clear();
  }
}

export const daoCache = new DAOCache();
