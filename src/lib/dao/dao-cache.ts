import { DAO, DAOProposal } from '@/api/types/dao';

/**
 * Simple DAO Cache System
 * Replaces UnifiedCacheManager dependency with focused DAO-only caching
 */

type CacheItem<T> = {
  data: T;
  timestamp: number;
  expiresAt: number;
};

class SimpleDAOCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly defaultTTL = 3 * 60 * 1000; // 3 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    const timestamp = Date.now();
    const expiresAt = timestamp + (ttl || this.defaultTTL);
    
    this.cache.set(key, {
      data,
      timestamp,
      expiresAt
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // Check if item is expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // DAO-specific methods
  setAllDAOs(daos: DAO[], ttl?: number): void {
    this.set('all_daos', daos, ttl);
  }

  getAllDAOs(): DAO[] | null {
    return this.get<DAO[]>('all_daos');
  }

  setUserDAOs(pubkey: string, daos: DAO[], ttl?: number): void {
    this.set(`user_daos:${pubkey}`, daos, ttl);
  }

  getUserDAOs(pubkey: string): DAO[] | null {
    return this.get<DAO[]>(`user_daos:${pubkey}`);
  }

  setTrendingDAOs(daos: DAO[], ttl?: number): void {
    this.set('trending_daos', daos, ttl);
  }

  getTrendingDAOs(): DAO[] | null {
    return this.get<DAO[]>('trending_daos');
  }

  setDAO(daoId: string, dao: DAO, ttl?: number): void {
    this.set(`dao:${daoId}`, dao, ttl);
  }

  getDAO(daoId: string): DAO | null {
    return this.get<DAO>(`dao:${daoId}`);
  }

  setDAOProposals(daoId: string, proposals: DAOProposal[], ttl?: number): void {
    this.set(`dao_proposals:${daoId}`, proposals, ttl);
  }

  getDAOProposals(daoId: string): DAOProposal[] | null {
    return this.get<DAOProposal[]>(`dao_proposals:${daoId}`);
  }

  invalidateDAO(daoId: string): void {
    this.delete(`dao:${daoId}`);
    this.delete(`dao_proposals:${daoId}`);
  }
}

// Create singleton instance
const daoCache = new SimpleDAOCache();

// Constants
const STANDARD_TTL = 3 * 60 * 1000; // 3 minutes
const INDEFINITE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Cache functions for DAOs
export function cacheAllDAOs(daos: DAO[]): void {
  daoCache.setAllDAOs(daos);
}

export function cacheAllDAOsLongTerm(daos: DAO[]): void {
  daoCache.setAllDAOs(daos, STANDARD_TTL);
  
  // Cache the timestamp when we cached all DAOs
  daoCache.set('all_daos_cached_at', Date.now(), STANDARD_TTL);
}

// Check when all DAOs were last cached
export function getAllDAOsCachedAt(): number | null {
  return daoCache.get<number>('all_daos_cached_at');
}

export function getCachedAllDAOs(): DAO[] | null {
  return daoCache.getAllDAOs();
}

export function cacheUserDAOs(pubkey: string, daos: DAO[]): void {
  daoCache.setUserDAOs(pubkey, daos);
}

// Cache user DAOs for a longer period (can be used for offline functionality)
export function cacheUserDAOsLongTerm(pubkey: string, daos: DAO[]): void {
  daoCache.setUserDAOs(pubkey, daos, INDEFINITE_TTL);
  
  // Cache the timestamp when we cached user DAOs
  daoCache.set(`user_daos_cached_at:${pubkey}`, Date.now(), INDEFINITE_TTL);
}

// Check when user DAOs were last cached
export function getUserDAOsCachedAt(pubkey: string): number | null {
  return daoCache.get<number>(`user_daos_cached_at:${pubkey}`);
}

// Get the age of cached user DAOs in milliseconds
export function getUserDAOsCacheAge(pubkey: string): number | null {
  const cachedAt = getUserDAOsCachedAt(pubkey);
  if (!cachedAt) return null;
  
  return Date.now() - cachedAt;
}

// Invalidate user DAOs cache
export function invalidateUserDAOsCache(pubkey: string): void {
  daoCache.delete(`user_daos:${pubkey}`);
  daoCache.delete(`user_daos_cached_at:${pubkey}`);
}

// Cache cleanup function
export function cleanupExpiredDAOCache(): void {
  // The simple cache automatically handles expiration on access
  // This is just for compatibility
}

export function getCachedUserDAOs(pubkey: string): DAO[] | null {
  return daoCache.getUserDAOs(pubkey);
}

export function cacheTrendingDAOs(daos: DAO[]): void {
  daoCache.setTrendingDAOs(daos);
}

export function getCachedTrendingDAOs(): DAO[] | null {
  return daoCache.getTrendingDAOs();
}

export function cacheDAO(daoId: string, dao: DAO): void {
  daoCache.setDAO(daoId, dao);
}

export function getCachedDAO(daoId: string): DAO | null {
  return daoCache.getDAO(daoId);
}

export function cacheDAOProposals(daoId: string, proposals: DAOProposal[]): void {
  daoCache.setDAOProposals(daoId, proposals);
}

export function getCachedDAOProposals(daoId: string): DAOProposal[] | null {
  return daoCache.getDAOProposals(daoId);
}

export function cacheKickProposals(daoId: string, proposals: any[]): void {
  daoCache.set(`kick_proposals:${daoId}`, proposals);
}

export function getCachedKickProposals(daoId: string): any[] | null {
  return daoCache.get<any[]>(`kick_proposals:${daoId}`);
}

export function invalidateDAOCache(daoId: string): void {
  daoCache.invalidateDAO(daoId);
}

export function invalidateUserDAOCache(pubkey: string): void {
  daoCache.delete(`daos:user:${pubkey}`);
}

export function clearAllDAOCache(): void {
  daoCache.clear();
}

