
import { cacheManager } from '@/lib/utils/cacheManager';
import { DAO, DAOProposal } from '@/types/dao';

// Cache keys and TTL (time-to-live) constants
const CACHE_KEYS = {
  ALL_DAOS: 'daos:all',
  USER_DAOS: 'daos:user:',
  TRENDING_DAOS: 'daos:trending',
  DAO_DETAILS: 'dao:',
  PROPOSALS: 'proposals:',
  KICK_PROPOSALS: 'kick_proposals:'
};

// Cache expiration times
const CACHE_TTL = {
  DAOS: 5 * 60 * 1000, // 5 minutes
  DAO_DETAILS: 3 * 60 * 1000, // 3 minutes
  PROPOSALS: 2 * 60 * 1000, // 2 minutes
  MINIMAL: 30 * 1000 // 30 seconds for frequently updated data
};

/**
 * DAO Cache Service
 * Handles caching for DAO-related data to improve loading performance
 */
export class DAOCache {
  // Cache all DAOs
  cacheAllDAOs(daos: DAO[]): void {
    cacheManager.set(CACHE_KEYS.ALL_DAOS, daos, CACHE_TTL.DAOS);
  }
  
  // Get all cached DAOs
  getAllDAOs(): DAO[] | null {
    return cacheManager.get<DAO[]>(CACHE_KEYS.ALL_DAOS);
  }
  
  // Cache user DAOs
  cacheUserDAOs(pubkey: string, daos: DAO[]): void {
    cacheManager.set(`${CACHE_KEYS.USER_DAOS}${pubkey}`, daos, CACHE_TTL.DAOS);
  }
  
  // Get user cached DAOs
  getUserDAOs(pubkey: string): DAO[] | null {
    return cacheManager.get<DAO[]>(`${CACHE_KEYS.USER_DAOS}${pubkey}`);
  }
  
  // Cache trending DAOs
  cacheTrendingDAOs(daos: DAO[]): void {
    cacheManager.set(CACHE_KEYS.TRENDING_DAOS, daos, CACHE_TTL.MINIMAL);
  }
  
  // Get cached trending DAOs
  getTrendingDAOs(): DAO[] | null {
    return cacheManager.get<DAO[]>(CACHE_KEYS.TRENDING_DAOS);
  }
  
  // Cache single DAO details
  cacheDAODetails(daoId: string, dao: DAO): void {
    cacheManager.set(`${CACHE_KEYS.DAO_DETAILS}${daoId}`, dao, CACHE_TTL.DAO_DETAILS);
  }
  
  // Get cached DAO details
  getDAODetails(daoId: string): DAO | null {
    return cacheManager.get<DAO>(`${CACHE_KEYS.DAO_DETAILS}${daoId}`);
  }
  
  // Cache proposals for a DAO
  cacheProposals(daoId: string, proposals: DAOProposal[]): void {
    cacheManager.set(`${CACHE_KEYS.PROPOSALS}${daoId}`, proposals, CACHE_TTL.PROPOSALS);
  }
  
  // Get cached proposals
  getProposals(daoId: string): DAOProposal[] | null {
    return cacheManager.get<DAOProposal[]>(`${CACHE_KEYS.PROPOSALS}${daoId}`);
  }
  
  // Cache kick proposals for a DAO
  cacheKickProposals(daoId: string, kickProposals: any[]): void {
    cacheManager.set(`${CACHE_KEYS.KICK_PROPOSALS}${daoId}`, kickProposals, CACHE_TTL.MINIMAL);
  }
  
  // Get cached kick proposals
  getKickProposals(daoId: string): any[] | null {
    return cacheManager.get<any[]>(`${CACHE_KEYS.KICK_PROPOSALS}${daoId}`);
  }
  
  // Invalidate specific cache entries when data changes
  invalidateDAO(daoId: string): void {
    cacheManager.delete(`${CACHE_KEYS.DAO_DETAILS}${daoId}`);
  }
  
  // Invalidate user DAOs cache
  invalidateUserDAOs(pubkey: string): void {
    cacheManager.delete(`${CACHE_KEYS.USER_DAOS}${pubkey}`);
  }
  
  // Invalidate proposals cache for a DAO
  invalidateProposals(daoId: string): void {
    cacheManager.delete(`${CACHE_KEYS.PROPOSALS}${daoId}`);
    cacheManager.delete(`${CACHE_KEYS.KICK_PROPOSALS}${daoId}`);
  }
  
  // Complete cache cleanup for DAOs
  clearAll(): void {
    const keys = Object.values(CACHE_KEYS);
    keys.forEach(key => {
      cacheManager.deleteKeysWithPrefix(key);
    });
  }
}

// Export a singleton instance
export const daoCache = new DAOCache();
