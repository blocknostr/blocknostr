
/**
 * A simple cache for Nostr content to improve performance and reduce relay load
 * This is a temporary solution until a more comprehensive cache system is implemented
 */

import { NostrEvent, NostrProfileMetadata } from './types';

class ContentCache {
  private profiles: Map<string, NostrProfileMetadata> = new Map();
  private events: Map<string, NostrEvent> = new Map();
  private ttl: number = 30 * 60 * 1000; // 30 minutes default TTL
  private maxSize: number = 1000; // Maximum number of items to cache
  
  constructor(ttl?: number, maxSize?: number) {
    if (ttl) this.ttl = ttl;
    if (maxSize) this.maxSize = maxSize;
  }
  
  // Profile caching methods
  public cacheProfile(pubkey: string, profile: NostrProfileMetadata): void {
    if (this.profiles.size >= this.maxSize) {
      // Clear the oldest 20% of entries when we hit the limit
      const keys = [...this.profiles.keys()];
      const toRemove = Math.floor(this.maxSize * 0.2);
      for (let i = 0; i < toRemove; i++) {
        this.profiles.delete(keys[i]);
      }
    }
    this.profiles.set(pubkey, {...profile, _cachedAt: Date.now()});
  }
  
  public getProfile(pubkey: string): NostrProfileMetadata | null {
    const profile = this.profiles.get(pubkey);
    if (!profile) return null;
    
    // Check if cache is still valid
    const cachedAt = (profile as any)._cachedAt || 0;
    if (Date.now() - cachedAt > this.ttl) {
      this.profiles.delete(pubkey);
      return null;
    }
    
    return profile;
  }
  
  // Event caching methods
  public cacheEvent(event: NostrEvent): void {
    if (this.events.size >= this.maxSize) {
      // Clear the oldest 20% of entries when we hit the limit
      const keys = [...this.events.keys()];
      const toRemove = Math.floor(this.maxSize * 0.2);
      for (let i = 0; i < toRemove; i++) {
        this.events.delete(keys[i]);
      }
    }
    this.events.set(event.id, {...event, _cachedAt: Date.now()});
  }
  
  public getEvent(eventId: string): NostrEvent | null {
    const event = this.events.get(eventId);
    if (!event) return null;
    
    // Check if cache is still valid
    const cachedAt = (event as any)._cachedAt || 0;
    if (Date.now() - cachedAt > this.ttl) {
      this.events.delete(eventId);
      return null;
    }
    
    return event;
  }
  
  // Bulk caching
  public cacheEvents(events: NostrEvent[]): void {
    events.forEach(event => this.cacheEvent(event));
  }
  
  public cacheProfiles(profiles: Record<string, NostrProfileMetadata>): void {
    Object.entries(profiles).forEach(([pubkey, profile]) => {
      this.cacheProfile(pubkey, profile);
    });
  }
  
  // Cache management
  public clearCache(): void {
    this.profiles.clear();
    this.events.clear();
  }
  
  public setTTL(ttl: number): void {
    this.ttl = ttl;
  }
  
  public setCacheSize(maxSize: number): void {
    this.maxSize = maxSize;
  }
}

// Export a singleton instance
export const contentCache = new ContentCache();
