
import { DAO } from "@/types/dao";

/**
 * Cache for DAO-related data
 */
class DAOCache {
  // In-memory cache for active page
  private daosCache: Map<string, DAO> = new Map();
  private allDaosCache: DAO[] = [];
  private userDaosCache: Map<string, string[]> = new Map(); // userId -> daoIds
  private trendingDaosCache: DAO[] = [];
  
  // Cache timeout (10 minutes)
  private cacheTimeout = 10 * 60 * 1000;
  private lastAllDaosFetch: number = 0;
  private lastTrendingFetch: number = 0;
  private lastUserFetch: Map<string, number> = new Map();
  
  /**
   * Get a DAO from cache by ID
   */
  async getDAOById(daoId: string): Promise<DAO | null> {
    return this.daosCache.get(daoId) || null;
  }
  
  /**
   * Cache a DAO
   */
  async cacheDAO(dao: DAO): Promise<void> {
    this.daosCache.set(dao.id, dao);
    
    // Update in allDaos cache if present
    const allDaoIndex = this.allDaosCache.findIndex(d => d.id === dao.id);
    if (allDaoIndex >= 0) {
      this.allDaosCache[allDaoIndex] = dao;
    }
    
    // Update in trending cache if present
    const trendingDaoIndex = this.trendingDaosCache.findIndex(d => d.id === dao.id);
    if (trendingDaoIndex >= 0) {
      this.trendingDaosCache[trendingDaoIndex] = dao;
    }
  }
  
  /**
   * Cache multiple DAOs
   */
  async cacheDAOs(daos: DAO[]): Promise<void> {
    for (const dao of daos) {
      this.daosCache.set(dao.id, dao);
    }
    
    this.allDaosCache = [...daos];
    this.lastAllDaosFetch = Date.now();
  }
  
  /**
   * Cache trending DAOs
   */
  async cacheTrendingDAOs(daos: DAO[]): Promise<void> {
    for (const dao of daos) {
      this.daosCache.set(dao.id, dao);
    }
    
    this.trendingDaosCache = [...daos];
    this.lastTrendingFetch = Date.now();
  }
  
  /**
   * Get all DAOs from cache
   */
  async getAllDAOs(): Promise<DAO[]> {
    // Check if cache is still valid
    if (this.lastAllDaosFetch + this.cacheTimeout > Date.now()) {
      return this.allDaosCache;
    }
    
    return [];
  }
  
  /**
   * Get trending DAOs from cache
   */
  async getTrendingDAOs(): Promise<DAO[]> {
    // Check if cache is still valid
    if (this.lastTrendingFetch + this.cacheTimeout > Date.now()) {
      return this.trendingDaosCache;
    }
    
    return [];
  }
  
  /**
   * Cache user's DAOs
   */
  async cacheUserDAOs(userId: string, daos: DAO[]): Promise<void> {
    // Cache the DAO objects
    for (const dao of daos) {
      this.daosCache.set(dao.id, dao);
    }
    
    // Store the relationship
    this.userDaosCache.set(userId, daos.map(dao => dao.id));
    this.lastUserFetch.set(userId, Date.now());
  }
  
  /**
   * Add a DAO to a user's DAOs
   */
  async addUserDAO(userId: string, daoId: string): Promise<void> {
    const userDaos = this.userDaosCache.get(userId) || [];
    if (!userDaos.includes(daoId)) {
      userDaos.push(daoId);
      this.userDaosCache.set(userId, userDaos);
      this.lastUserFetch.set(userId, Date.now());
    }
  }
  
  /**
   * Remove a DAO from a user's DAOs
   */
  async removeUserDAO(userId: string, daoId: string): Promise<void> {
    const userDaos = this.userDaosCache.get(userId) || [];
    const updatedDaos = userDaos.filter(id => id !== daoId);
    this.userDaosCache.set(userId, updatedDaos);
    this.lastUserFetch.set(userId, Date.now());
  }
  
  /**
   * Get user's DAOs from cache
   */
  async getUserDAOs(userId: string): Promise<DAO[]> {
    // Check if cache is still valid
    const lastFetch = this.lastUserFetch.get(userId);
    if (lastFetch && lastFetch + this.cacheTimeout > Date.now()) {
      const daoIds = this.userDaosCache.get(userId) || [];
      const daos: DAO[] = [];
      
      for (const daoId of daoIds) {
        const dao = this.daosCache.get(daoId);
        if (dao) {
          daos.push(dao);
        }
      }
      
      return daos;
    }
    
    return [];
  }
  
  /**
   * Invalidate all cache
   */
  async clearAll(): Promise<void> {
    this.daosCache.clear();
    this.allDaosCache = [];
    this.userDaosCache.clear();
    this.trendingDaosCache = [];
    this.lastAllDaosFetch = 0;
    this.lastTrendingFetch = 0;
    this.lastUserFetch.clear();
  }
  
  /**
   * Invalidate a specific DAO
   */
  async invalidateDAO(daoId: string): Promise<void> {
    this.daosCache.delete(daoId);
    
    // Update all collections containing this DAO
    this.allDaosCache = this.allDaosCache.filter(dao => dao.id !== daoId);
    this.trendingDaosCache = this.trendingDaosCache.filter(dao => dao.id !== daoId);
    
    // Force refresh on next access
    this.lastAllDaosFetch = 0;
    this.lastTrendingFetch = 0;
  }
  
  /**
   * Invalidate DAO details cache
   */
  async invalidateDAODetails(daoId: string): Promise<void> {
    this.daosCache.delete(daoId);
  }
  
  /**
   * Invalidate a user's DAOs cache
   */
  async invalidateUserDAOs(userId: string): Promise<void> {
    this.userDaosCache.delete(userId);
    this.lastUserFetch.delete(userId);
  }
  
  /**
   * Invalidate trending DAOs cache
   */
  async invalidateTrendingDAOs(): Promise<void> {
    this.trendingDaosCache = [];
    this.lastTrendingFetch = 0;
  }
  
  /**
   * Invalidate all DAOs cache
   */
  async invalidateAllDAOs(): Promise<void> {
    this.allDaosCache = [];
    this.lastAllDaosFetch = 0;
  }
}

// Export a singleton instance
export const daoCache = new DAOCache();
