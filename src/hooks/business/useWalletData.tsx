/**
 * useWalletData - Performance-optimized hook for wallet data management
 * Provides memoized data with intelligent caching and smart re-rendering
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { walletAdapter, WalletSummary, PerformanceMetrics } from '../lib/adapters/WalletAdapter';

export interface UseWalletDataOptions {
  enableAutoRefresh?: boolean;
  refreshInterval?: number;
  enablePreloading?: boolean;
  debounceMs?: number;
  staleTime?: number;
}

export interface UseWalletDataReturn {
  // Core data
  walletSummary: WalletSummary | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  refresh: () => Promise<void>;
  clearCache: () => void;
  
  // Performance
  performanceMetrics: PerformanceMetrics;
  lastUpdated: number;
  
  // State indicators
  isStale: boolean;
  isCacheHit: boolean;
}

const DEFAULT_OPTIONS: Required<UseWalletDataOptions> = {
  enableAutoRefresh: true,
  refreshInterval: 30000, // 30 seconds
  enablePreloading: false,
  debounceMs: 300,
  staleTime: 60000 // 1 minute
};

export function useWalletData(
  address: string | null,
  options: UseWalletDataOptions = {}
): UseWalletDataReturn {
  const config = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options]);
  
  // State management with optimizations
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(0);
  const [isCacheHit, setIsCacheHit] = useState(false);
  
  // Refs for cleanup and debouncing
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const lastAddressRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  // Performance metrics (memoized)
  const performanceMetrics = useMemo(() => {
    return walletAdapter.getPerformanceMetrics();
  }, [lastUpdated]);

  // Check if data is stale
  const isStale = useMemo(() => {
    if (!lastUpdated) return true;
    return Date.now() - lastUpdated > config.staleTime;
  }, [lastUpdated, config.staleTime]);

  // Debounced refresh function
  const debouncedRefresh = useCallback(
    (forceRefresh: boolean = false) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(async () => {
        if (!address || !mountedRef.current) return;

        console.log(`[useWalletData] ${forceRefresh ? 'Force ' : ''}Refreshing data for ${address}`);
        setIsLoading(true);
        setError(null);

        try {
          const startTime = Date.now();
          const summary = await walletAdapter.getWalletSummary(address, forceRefresh);
          const loadTime = Date.now() - startTime;
          
          if (mountedRef.current) {
            setWalletSummary(summary);
            setError(summary.error);
            setLastUpdated(Date.now());
            setIsCacheHit(loadTime < 50); // Assume cache hit if load time < 50ms
            
            console.log(`[useWalletData] Data refreshed for ${address} in ${loadTime}ms (cache hit: ${loadTime < 50})`);
          }
        } catch (err) {
          if (mountedRef.current) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            console.error(`[useWalletData] Error refreshing data for ${address}:`, err);
          }
        } finally {
          if (mountedRef.current) {
            setIsLoading(false);
          }
        }
      }, config.debounceMs);
    },
    [address, config.debounceMs]
  );

  // Memoized refresh function
  const refresh = useCallback(async () => {
    debouncedRefresh(true);
  }, [debouncedRefresh]);

  // Memoized clear cache function
  const clearCache = useCallback(() => {
    if (address) {
      walletAdapter.clearCache(address);
      setLastUpdated(0);
      setIsCacheHit(false);
      console.log(`[useWalletData] Cleared cache for ${address}`);
    }
  }, [address]);

  // Setup auto-refresh interval
  useEffect(() => {
    if (!config.enableAutoRefresh || !address) return;

    const setupAutoRefresh = () => {
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = setInterval(() => {
        if (mountedRef.current && !isLoading) {
          console.log(`[useWalletData] Auto-refreshing data for ${address}`);
          debouncedRefresh(false);
        }
      }, config.refreshInterval);

      console.log(`[useWalletData] Auto-refresh enabled for ${address} (${config.refreshInterval}ms)`);
    };

    setupAutoRefresh();

    return () => {
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current);
      }
    };
  }, [address, config.enableAutoRefresh, config.refreshInterval, isLoading, debouncedRefresh]);

  // Setup subscription to real-time updates
  useEffect(() => {
    if (!address) return;

    // Clean up previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Subscribe to wallet changes
    unsubscribeRef.current = walletAdapter.subscribeToWallet(address, (summary) => {
      if (mountedRef.current) {
        console.log(`[useWalletData] Received subscription update for ${address}`);
        setWalletSummary(summary);
        setError(summary.error);
        setLastUpdated(Date.now());
        setIsCacheHit(true); // Subscription updates are considered cache hits
      }
    });

    console.log(`[useWalletData] Subscribed to wallet updates for ${address}`);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [address]);

  // Initial data fetch when address changes
  useEffect(() => {
    if (!address) {
      // Clear data when address is null
      setWalletSummary(null);
      setError(null);
      setLastUpdated(0);
      setIsCacheHit(false);
      lastAddressRef.current = null;
      return;
    }

    // Check if address actually changed
    if (address === lastAddressRef.current) {
      return;
    }

    lastAddressRef.current = address;
    console.log(`[useWalletData] Address changed to ${address}, fetching data`);

    // Reset state for new address
    setWalletSummary(null);
    setError(null);
    setLastUpdated(0);
    setIsCacheHit(false);

    // Fetch data
    debouncedRefresh(false);
  }, [address, debouncedRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      
      // Cleanup timeouts
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      // Cleanup subscription
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      
      console.log('[useWalletData] Hook unmounted, cleaned up resources');
    };
  }, []);

  // Memoized return value to prevent unnecessary re-renders
  return useMemo(
    () => ({
      walletSummary,
      isLoading,
      error,
      refresh,
      clearCache,
      performanceMetrics,
      lastUpdated,
      isStale,
      isCacheHit
    }),
    [
      walletSummary,
      isLoading,
      error,
      refresh,
      clearCache,
      performanceMetrics,
      lastUpdated,
      isStale,
      isCacheHit
    ]
  );
}

// Hook for batch wallet data (multi-wallet view)
export interface UseBatchWalletDataReturn {
  walletSummaries: Map<string, WalletSummary>;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  clearCache: () => void;
  performanceMetrics: PerformanceMetrics;
}

export function useBatchWalletData(
  addresses: string[],
  options: UseWalletDataOptions = {}
): UseBatchWalletDataReturn {
  const config = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options]);
  
  const [walletSummaries, setWalletSummaries] = useState<Map<string, WalletSummary>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mountedRef = useRef(true);
  const lastAddressesRef = useRef<string[]>([]);

  // Performance metrics
  const performanceMetrics = useMemo(() => {
    return walletAdapter.getPerformanceMetrics();
  }, [walletSummaries.size]);

  // Memoized addresses to prevent unnecessary re-renders
  const memoizedAddresses = useMemo(() => [...addresses], [addresses.join(',')]);

  // Batch refresh function
  const refresh = useCallback(async () => {
    if (memoizedAddresses.length === 0) return;

    console.log(`[useBatchWalletData] Batch refreshing ${memoizedAddresses.length} wallets`);
    setIsLoading(true);
    setError(null);

    try {
      const summaries = await walletAdapter.getBatchWalletSummaries(memoizedAddresses, true);
      
      if (mountedRef.current) {
        setWalletSummaries(summaries);
        console.log(`[useBatchWalletData] Batch refresh completed for ${summaries.size} wallets`);
      }
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Batch fetch error';
        setError(errorMessage);
        console.error('[useBatchWalletData] Batch refresh error:', err);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [memoizedAddresses]);

  // Clear cache for all addresses
  const clearCache = useCallback(() => {
    memoizedAddresses.forEach(address => walletAdapter.clearCache(address));
    console.log(`[useBatchWalletData] Cleared cache for ${memoizedAddresses.length} wallets`);
  }, [memoizedAddresses]);

  // Initial fetch when addresses change
  useEffect(() => {
    // Check if addresses actually changed
    const addressesChanged = 
      memoizedAddresses.length !== lastAddressesRef.current.length ||
      !memoizedAddresses.every((addr, index) => addr === lastAddressesRef.current[index]);

    if (!addressesChanged) return;

    lastAddressesRef.current = [...memoizedAddresses];
    
    if (memoizedAddresses.length === 0) {
      setWalletSummaries(new Map());
      setError(null);
      return;
    }

    console.log(`[useBatchWalletData] Addresses changed, fetching data for ${memoizedAddresses.length} wallets`);
    refresh();
  }, [memoizedAddresses, refresh]);

  // Cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return useMemo(
    () => ({
      walletSummaries,
      isLoading,
      error,
      refresh,
      clearCache,
      performanceMetrics
    }),
    [walletSummaries, isLoading, error, refresh, clearCache, performanceMetrics]
  );
} 

