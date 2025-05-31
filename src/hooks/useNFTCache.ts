import { useState, useEffect, useCallback } from 'react';

// Import the NFT cache class (we'll need to export it from NFTGallery)
// For now, we'll define a minimal interface
interface NFTCacheStats {
  totalAddresses: number;
  totalNFTs: number;
  totalMetadata: number;
  oldestCache: number | null;
  cacheSize: string;
}

interface UseNFTCacheReturn {
  stats: NFTCacheStats;
  isLoading: boolean;
  refreshStats: () => Promise<void>;
  clearCache: (address?: string) => Promise<void>;
  clearAllCache: () => Promise<void>;
  getCachedAddresses: () => string[];
}

// Global reference to the NFT cache instance
let nftCacheInstance: any = null;

// Function to get the cache instance (will be set by NFTGallery)
export const setNFTCacheInstance = (instance: any) => {
  nftCacheInstance = instance;
};

export const useNFTCache = (): UseNFTCacheReturn => {
  const [stats, setStats] = useState<NFTCacheStats>({
    totalAddresses: 0,
    totalNFTs: 0,
    totalMetadata: 0,
    oldestCache: null,
    cacheSize: '0 KB'
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const refreshStats = useCallback(async () => {
    if (!nftCacheInstance) return;
    
    setIsLoading(true);
    try {
      const cacheStats = await nftCacheInstance.getCacheStats();
      setStats(cacheStats);
    } catch (error) {
      console.error('[useNFTCache] Error refreshing stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCache = useCallback(async (address?: string) => {
    if (!nftCacheInstance) return;
    
    try {
      await nftCacheInstance.clearCache(address);
      await refreshStats(); // Refresh stats after clearing
    } catch (error) {
      console.error('[useNFTCache] Error clearing cache:', error);
    }
  }, [refreshStats]);

  const clearAllCache = useCallback(async () => {
    await clearCache(); // Clear all when no address specified
  }, [clearCache]);

  const getCachedAddresses = useCallback((): string[] => {
    if (!nftCacheInstance) return [];
    
    try {
      // This would need to be implemented in the NFTCache class
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('[useNFTCache] Error getting cached addresses:', error);
      return [];
    }
  }, []);

  // Load initial stats when cache instance is available
  useEffect(() => {
    if (nftCacheInstance) {
      refreshStats();
    }
  }, [refreshStats]);

  return {
    stats,
    isLoading,
    refreshStats,
    clearCache,
    clearAllCache,
    getCachedAddresses
  };
};

export default useNFTCache; 
