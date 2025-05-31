/**
 * useTokenList - Performance-optimized hook for token list management
 * Provides virtualization, filtering, sorting, and search with memoization
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { walletAdapter, TokenSummary } from '../lib/adapters/WalletAdapter';
import { EnrichedToken } from '../lib/api/alephiumApi';

export interface TokenFilter {
  category: 'all' | 'verified' | 'lp' | 'nft';
  minValue: number;
  searchTerm: string;
  sortBy: 'value' | 'amount' | 'alphabetical';
  sortOrder: 'asc' | 'desc';
  hideZeroBalance: boolean;
}

export interface VirtualizationConfig {
  enabled: boolean;
  itemHeight: number;
  overscan: number;
  containerHeight?: number;
}

export interface UseTokenListOptions {
  enableVirtualization?: boolean;
  virtualizationConfig?: Partial<VirtualizationConfig>;
  debounceMs?: number;
  enableAutoUpdate?: boolean;
  updateInterval?: number;
}

export interface UseTokenListReturn {
  // Core data
  tokens: EnrichedToken[];
  tokenSummary: TokenSummary | null;
  filteredTokens: EnrichedToken[];
  visibleTokens: EnrichedToken[];
  
  // State
  isLoading: boolean;
  error: string | null;
  
  // Filter/Search
  filters: TokenFilter;
  updateFilter: (key: keyof TokenFilter, value: any) => void;
  resetFilters: () => void;
  
  // Virtualization
  virtualization: {
    totalItems: number;
    startIndex: number;
    endIndex: number;
    containerHeight: number;
    scrollOffset: number;
  };
  setScrollOffset: (offset: number) => void;
  
  // Actions
  refresh: () => Promise<void>;
  clearCache: () => void;
  
  // Performance
  performanceInfo: {
    totalTokens: number;
    filteredCount: number;
    renderCount: number;
    lastFilterTime: number;
    cacheHitRate: number;
  };
}

const DEFAULT_FILTER: TokenFilter = {
  category: 'all',
  minValue: 0,
  searchTerm: '',
  sortBy: 'value',
  sortOrder: 'desc',
  hideZeroBalance: false
};

const DEFAULT_VIRTUALIZATION: VirtualizationConfig = {
  enabled: true,
  itemHeight: 80,
  overscan: 5,
  containerHeight: 600
};

const DEFAULT_OPTIONS: Required<UseTokenListOptions> = {
  enableVirtualization: true,
  virtualizationConfig: DEFAULT_VIRTUALIZATION,
  debounceMs: 300,
  enableAutoUpdate: false,
  updateInterval: 60000
};

export function useTokenList(
  address: string | null,
  options: UseTokenListOptions = {}
): UseTokenListReturn {
  const config = useMemo(() => ({
    ...DEFAULT_OPTIONS,
    ...options,
    virtualizationConfig: { ...DEFAULT_VIRTUALIZATION, ...options.virtualizationConfig }
  }), [options]);

  // State management
  const [tokens, setTokens] = useState<EnrichedToken[]>([]);
  const [tokenSummary, setTokenSummary] = useState<TokenSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TokenFilter>(DEFAULT_FILTER);
  const [scrollOffset, setScrollOffset] = useState(0);
  
  // Performance tracking
  const [performanceInfo, setPerformanceInfo] = useState({
    totalTokens: 0,
    filteredCount: 0,
    renderCount: 0,
    lastFilterTime: 0,
    cacheHitRate: 0
  });

  // Refs for optimization
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);
  const lastFiltersRef = useRef<TokenFilter>(DEFAULT_FILTER);
  const lastAddressRef = useRef<string | null>(null);

  // Memoized filtered tokens with performance tracking
  const filteredTokens = useMemo(() => {
    const startTime = Date.now();
    
    if (!tokens.length) {
      return [];
    }

    let filtered = [...tokens];

    // Apply category filter
    if (filters.category !== 'all') {
      switch (filters.category) {
        case 'verified':
          filtered = filtered.filter(t => t.priceSource === 'market');
          break;
        case 'lp':
          filtered = filtered.filter(t => t.isLPToken);
          break;
        case 'nft':
          filtered = filtered.filter(t => t.isNFT);
          break;
      }
    }

    // Apply minimum value filter
    if (filters.minValue > 0) {
      filtered = filtered.filter(t => (t.usdValue || 0) >= filters.minValue);
    }

    // Apply zero balance filter
    if (filters.hideZeroBalance) {
      filtered = filtered.filter(t => {
        const amount = parseFloat(t.amount || '0');
        return amount > 0;
      });
    }

    // Apply search filter
    if (filters.searchTerm.trim()) {
      const searchLower = filters.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchLower) ||
        t.symbol.toLowerCase().includes(searchLower) ||
        t.id.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    const sortMultiplier = filters.sortOrder === 'asc' ? 1 : -1;
    
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'value':
          return ((b.usdValue || 0) - (a.usdValue || 0)) * sortMultiplier;
        case 'amount':
          return (parseFloat(b.amount || '0') - parseFloat(a.amount || '0')) * sortMultiplier;
        case 'alphabetical':
          return a.symbol.localeCompare(b.symbol) * sortMultiplier;
        default:
          return 0;
      }
    });

    const filterTime = Date.now() - startTime;
    
    setPerformanceInfo(prev => ({
      ...prev,
      filteredCount: filtered.length,
      lastFilterTime: filterTime
    }));

    console.log(`[useTokenList] Filtered ${tokens.length} → ${filtered.length} tokens in ${filterTime}ms`);
    
    return filtered;
  }, [tokens, filters]);

  // Memoized visible tokens for virtualization
  const visibleTokens = useMemo(() => {
    if (!config.enableVirtualization || !config.virtualizationConfig.enabled) {
      setPerformanceInfo(prev => ({ ...prev, renderCount: filteredTokens.length }));
      return filteredTokens;
    }

    const { itemHeight, overscan, containerHeight } = config.virtualizationConfig;
    const visibleCount = Math.ceil((containerHeight || 600) / itemHeight);
    const startIndex = Math.floor(scrollOffset / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount + overscan, filteredTokens.length);
    const actualStartIndex = Math.max(0, startIndex - overscan);

    const visible = filteredTokens.slice(actualStartIndex, endIndex);
    
    setPerformanceInfo(prev => ({ 
      ...prev, 
      renderCount: visible.length 
    }));

    return visible;
  }, [filteredTokens, scrollOffset, config.enableVirtualization, config.virtualizationConfig]);

  // Virtualization info
  const virtualization = useMemo(() => {
    if (!config.enableVirtualization) {
      return {
        totalItems: filteredTokens.length,
        startIndex: 0,
        endIndex: filteredTokens.length,
        containerHeight: config.virtualizationConfig.containerHeight || 600,
        scrollOffset: 0
      };
    }

    const { itemHeight, overscan, containerHeight } = config.virtualizationConfig;
    const visibleCount = Math.ceil((containerHeight || 600) / itemHeight);
    const startIndex = Math.floor(scrollOffset / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount + overscan, filteredTokens.length);

    return {
      totalItems: filteredTokens.length,
      startIndex: Math.max(0, startIndex - overscan),
      endIndex,
      containerHeight: containerHeight || 600,
      scrollOffset
    };
  }, [filteredTokens.length, scrollOffset, config.enableVirtualization, config.virtualizationConfig]);

  // FIXED: Debounced fetch function - removed filters dependency
  const fetchTokenData = useCallback(async (addressToFetch: string, currentFilters: TokenFilter) => {
    if (!addressToFetch || !mountedRef.current) return;

    console.log(`[useTokenList] Fetching token data for ${addressToFetch}`);
    setIsLoading(true);
    setError(null);

    try {
      const [summary, filtered] = await Promise.all([
        walletAdapter.getTokenSummary(addressToFetch),
        walletAdapter.getFilteredTokens(addressToFetch, {
          minValue: currentFilters.minValue,
          category: currentFilters.category,
          sortBy: currentFilters.sortBy,
          sortOrder: currentFilters.sortOrder,
          searchTerm: currentFilters.searchTerm
        })
      ]);

      if (mountedRef.current) {
        setTokens(filtered);
        setTokenSummary(summary);
        
        setPerformanceInfo(prev => ({
          ...prev,
          totalTokens: filtered.length,
          cacheHitRate: walletAdapter.getPerformanceMetrics().cacheHitRate
        }));

        console.log(`[useTokenList] Updated token list: ${filtered.length} tokens`);
      }
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tokens';
        setError(errorMessage);
        console.error('[useTokenList] Error fetching token data:', err);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // FIXED: Debounced wrapper that doesn't depend on filters state
  const debouncedFetchData = useCallback((forceRefresh: boolean = false) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (address) {
        fetchTokenData(address, lastFiltersRef.current);
      }
    }, forceRefresh ? 0 : config.debounceMs);
  }, [address, fetchTokenData, config.debounceMs]);

  // Filter update functions
  const updateFilter = useCallback((key: keyof TokenFilter, value: any) => {
    setFilters(prev => {
      const updated = { ...prev, [key]: value };
      console.log(`[useTokenList] Updated filter ${key}:`, value);
      return updated;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTER);
    setScrollOffset(0);
    console.log('[useTokenList] Reset filters to default');
  }, []);

  // Manual refresh
  const refresh = useCallback(async () => {
    if (!address) return;
    
    console.log(`[useTokenList] Manual refresh for ${address}`);
    walletAdapter.clearCache(address);
    debouncedFetchData(true);
  }, [address, debouncedFetchData]);

  // Clear cache
  const clearCache = useCallback(() => {
    if (address) {
      walletAdapter.clearCache(address);
      console.log(`[useTokenList] Cleared cache for ${address}`);
    }
  }, [address]);

  // Effect for initial data fetch and address changes
  useEffect(() => {
    if (!address) {
      setTokens([]);
      setTokenSummary(null);
      setError(null);
      setScrollOffset(0);
      lastAddressRef.current = null;
      return;
    }

    // Only fetch if address actually changed
    if (address !== lastAddressRef.current) {
      lastAddressRef.current = address;
      console.log(`[useTokenList] Address changed to ${address}, fetching data`);
      debouncedFetchData();
    }
  }, [address, debouncedFetchData]);

  // FIXED: Filter changes effect - no longer depends on debouncedFetchData
  useEffect(() => {
    // Check if filters actually changed
    const filtersChanged = Object.keys(filters).some(
      key => filters[key as keyof TokenFilter] !== lastFiltersRef.current[key as keyof TokenFilter]
    );

    if (!filtersChanged) return;

    lastFiltersRef.current = { ...filters };
    console.log('[useTokenList] Filters changed, updating data');
    
    // Reset scroll position when filters change
    setScrollOffset(0);
    
    // Fetch new data if address exists - use a separate timeout to avoid circular dependency
    if (address) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      debounceTimeoutRef.current = setTimeout(() => {
        if (address && mountedRef.current) {
          fetchTokenData(address, lastFiltersRef.current);
        }
      }, config.debounceMs);
    }
  }, [filters, address, fetchTokenData, config.debounceMs]);

  // Auto-update interval
  useEffect(() => {
    if (!config.enableAutoUpdate || !address) return;

    updateTimeoutRef.current = setInterval(() => {
      if (mountedRef.current && !isLoading) {
        console.log(`[useTokenList] Auto-updating token data for ${address}`);
        debouncedFetchData();
      }
    }, config.updateInterval);

    console.log(`[useTokenList] Auto-update enabled (${config.updateInterval}ms)`);

    return () => {
      if (updateTimeoutRef.current) {
        clearInterval(updateTimeoutRef.current);
      }
    };
  }, [address, config.enableAutoUpdate, config.updateInterval, isLoading, debouncedFetchData]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (updateTimeoutRef.current) {
        clearInterval(updateTimeoutRef.current);
      }
      
      console.log('[useTokenList] Hook unmounted, cleaned up resources');
    };
  }, []);

  // Memoized return value
  return useMemo(
    () => ({
      tokens,
      tokenSummary,
      filteredTokens,
      visibleTokens,
      isLoading,
      error,
      filters,
      updateFilter,
      resetFilters,
      virtualization,
      setScrollOffset,
      refresh,
      clearCache,
      performanceInfo
    }),
    [
      tokens,
      tokenSummary,
      filteredTokens,
      visibleTokens,
      isLoading,
      error,
      filters,
      updateFilter,
      resetFilters,
      virtualization,
      setScrollOffset,
      refresh,
      clearCache,
      performanceInfo
    ]
  );
} 

