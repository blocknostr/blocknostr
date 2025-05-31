/**
 * WalletAdapter - Clean abstraction layer between data manager and hooks
 * Handles data transformation, business logic, and performance optimizations
 */

import { walletDataManager, WalletData, DataManagerStats } from '../services/WalletDataManager';
import { EnrichedToken } from '../api/alephiumApi';

export interface WalletSummary {
  address: string;
  totalValueUSD: number;
  totalValueALPH: number;
  tokenCount: number;
  nftCount: number;
  lastActivity: number;
  isLoading: boolean;
  error: string | null;
}

export interface TokenSummary {
  totalTokens: number;
  totalValueUSD: number;
  topTokens: EnrichedToken[];
  recentlyActive: EnrichedToken[];
  categories: {
    verified: number;
    lp: number;
    nft: number;
    regular: number;
  };
}

export interface PerformanceMetrics {
  cacheHitRate: number;
  averageLoadTime: number;
  activeRequests: number;
  totalCacheSize: number;
  lastUpdated: number;
}

export interface AdapterConfig {
  enablePreloading: boolean;
  batchSize: number;
  refreshInterval: number;
  enableTransformations: boolean;
}

class WalletAdapter {
  private config: AdapterConfig = {
    enablePreloading: true,
    batchSize: 5,
    refreshInterval: 30000,
    enableTransformations: true
  };

  private performanceTracker = {
    loadTimes: [] as number[],
    requestCounts: 0,
    startTime: Date.now()
  };

  constructor(config?: Partial<AdapterConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    console.log('[WalletAdapter] Initialized with config:', this.config);
  }

  /**
   * Get wallet summary with performance optimizations
   */
  async getWalletSummary(address: string, forceRefresh: boolean = false): Promise<WalletSummary> {
    const startTime = Date.now();
    this.performanceTracker.requestCounts++;

    try {
      const walletData = await walletDataManager.getWalletData(address, forceRefresh);
      const summary = this.transformToWalletSummary(walletData);
      
      // Track performance
      const loadTime = Date.now() - startTime;
      this.trackLoadTime(loadTime);
      
      console.log(`[WalletAdapter] Generated wallet summary for ${address} in ${loadTime}ms`);
      return summary;
    } catch (error) {
      console.error(`[WalletAdapter] Error getting wallet summary for ${address}:`, error);
      
      return {
        address,
        totalValueUSD: 0,
        totalValueALPH: 0,
        tokenCount: 0,
        nftCount: 0,
        lastActivity: 0,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get multiple wallet summaries efficiently
   */
  async getBatchWalletSummaries(addresses: string[], forceRefresh: boolean = false): Promise<Map<string, WalletSummary>> {
    console.log(`[WalletAdapter] Getting batch wallet summaries for ${addresses.length} addresses`);
    
    const startTime = Date.now();
    const walletDataMap = await walletDataManager.getBatchWalletData(addresses, forceRefresh);
    
    const summaries = new Map<string, WalletSummary>();
    
    for (const [address, walletData] of walletDataMap) {
      try {
        const summary = this.transformToWalletSummary(walletData);
        summaries.set(address, summary);
      } catch (error) {
        console.error(`[WalletAdapter] Error transforming summary for ${address}:`, error);
        summaries.set(address, {
          address,
          totalValueUSD: 0,
          totalValueALPH: 0,
          tokenCount: 0,
          nftCount: 0,
          lastActivity: 0,
          isLoading: false,
          error: 'Transformation error'
        });
      }
    }

    const batchTime = Date.now() - startTime;
    console.log(`[WalletAdapter] Batch summary completed in ${batchTime}ms`);

    return summaries;
  }

  /**
   * Get detailed token analysis for a wallet
   */
  async getTokenSummary(address: string): Promise<TokenSummary> {
    const walletData = await walletDataManager.getWalletData(address);
    return this.transformToTokenSummary(walletData.tokens);
  }

  /**
   * Get filtered and sorted tokens with optimizations
   */
  async getFilteredTokens(
    address: string,
    filters: {
      minValue?: number;
      category?: 'all' | 'verified' | 'lp' | 'nft';
      sortBy?: 'value' | 'amount' | 'alphabetical';
      sortOrder?: 'asc' | 'desc';
      searchTerm?: string;
    } = {}
  ): Promise<EnrichedToken[]> {
    const walletData = await walletDataManager.getWalletData(address);
    return this.applyFiltersAndSort(walletData.tokens, filters);
  }

  /**
   * Subscribe to wallet data changes with transformation
   */
  subscribeToWallet(address: string, callback: (summary: WalletSummary) => void): () => void {
    return walletDataManager.subscribe(address, (walletData) => {
      try {
        const summary = this.transformToWalletSummary(walletData);
        callback(summary);
      } catch (error) {
        console.error('[WalletAdapter] Error in subscription callback:', error);
      }
    });
  }

  /**
   * Preload wallet data intelligently
   */
  async preloadWallets(addresses: string[]): Promise<void> {
    if (!this.config.enablePreloading) return;

    // Split into batches to avoid overwhelming the system
    const batches = this.chunkArray(addresses, this.config.batchSize);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`[WalletAdapter] Preloading batch ${i + 1}/${batches.length} (${batch.length} addresses)`);
      
      await walletDataManager.preloadWalletData(batch);
      
      // Add delay between batches to prevent overwhelming
      if (i < batches.length - 1) {
        await this.delay(200);
      }
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const managerStats = walletDataManager.getStats();
    const avgLoadTime = this.performanceTracker.loadTimes.length > 0
      ? this.performanceTracker.loadTimes.reduce((a, b) => a + b, 0) / this.performanceTracker.loadTimes.length
      : 0;

    return {
      cacheHitRate: managerStats.hitRate,
      averageLoadTime: Math.round(avgLoadTime),
      activeRequests: managerStats.activeFetches,
      totalCacheSize: managerStats.cacheSize,
      lastUpdated: Date.now()
    };
  }

  /**
   * Clear cache and reset performance tracking
   */
  clearCache(address?: string): void {
    walletDataManager.clearCache(address);
    
    if (!address) {
      this.performanceTracker = {
        loadTimes: [],
        requestCounts: 0,
        startTime: Date.now()
      };
      console.log('[WalletAdapter] Cleared all cache and reset performance tracking');
    }
  }

  /**
   * Update adapter configuration
   */
  updateConfig(newConfig: Partial<AdapterConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('[WalletAdapter] Updated config:', this.config);
  }

  // Private transformation methods

  private transformToWalletSummary(walletData: WalletData): WalletSummary {
    if (!this.config.enableTransformations) {
      return {
        address: walletData.address,
        totalValueUSD: 0,
        totalValueALPH: 0,
        tokenCount: walletData.tokens.length,
        nftCount: walletData.nfts.length,
        lastActivity: walletData.lastUpdated,
        isLoading: walletData.isLoading,
        error: walletData.error
      };
    }

    // Calculate total values
    const totalValueUSD = walletData.balance.balance * this.getAlphPriceUSD() + 
      walletData.tokens.reduce((sum, token) => sum + (token.usdValue || 0), 0);
    
    const totalValueALPH = walletData.balance.balance + 
      walletData.tokens.reduce((sum, token) => sum + (token.alphValue || 0), 0);

    // Get last activity from transactions
    const lastActivity = walletData.transactions.length > 0
      ? Math.max(...walletData.transactions.map(tx => tx.timestamp || 0))
      : walletData.lastUpdated;

    return {
      address: walletData.address,
      totalValueUSD: Math.round(totalValueUSD * 100) / 100,
      totalValueALPH: Math.round(totalValueALPH * 10000) / 10000,
      tokenCount: walletData.tokens.filter(t => !t.isNFT).length,
      nftCount: walletData.nfts.length,
      lastActivity,
      isLoading: walletData.isLoading,
      error: walletData.error
    };
  }

  private transformToTokenSummary(tokens: EnrichedToken[]): TokenSummary {
    const regularTokens = tokens.filter(t => !t.isNFT);
    const totalValueUSD = regularTokens.reduce((sum, token) => sum + (token.usdValue || 0), 0);

    // Sort by value and get top tokens
    const sortedByValue = [...regularTokens].sort((a, b) => (b.usdValue || 0) - (a.usdValue || 0));
    const topTokens = sortedByValue.slice(0, 10);

    // Get recently active tokens (those with recent price updates)
    const recentlyActive = regularTokens
      .filter(token => token.priceSource === 'market')
      .slice(0, 5);

    // Categorize tokens
    const categories = {
      verified: regularTokens.filter(t => t.priceSource === 'market').length,
      lp: regularTokens.filter(t => t.isLPToken).length,
      nft: tokens.filter(t => t.isNFT).length,
      regular: regularTokens.filter(t => !t.isLPToken).length
    };

    return {
      totalTokens: regularTokens.length,
      totalValueUSD: Math.round(totalValueUSD * 100) / 100,
      topTokens,
      recentlyActive,
      categories
    };
  }

  private applyFiltersAndSort(
    tokens: EnrichedToken[],
    filters: {
      minValue?: number;
      category?: 'all' | 'verified' | 'lp' | 'nft';
      sortBy?: 'value' | 'amount' | 'alphabetical';
      sortOrder?: 'asc' | 'desc';
      searchTerm?: string;
    }
  ): EnrichedToken[] {
    let filtered = [...tokens];

    // Apply category filter
    if (filters.category && filters.category !== 'all') {
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
    if (filters.minValue !== undefined) {
      filtered = filtered.filter(t => (t.usdValue || 0) >= filters.minValue!);
    }

    // Apply search filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(term) ||
        t.symbol.toLowerCase().includes(term) ||
        t.id.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'value';
    const sortOrder = filters.sortOrder || 'desc';
    const multiplier = sortOrder === 'asc' ? 1 : -1;

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'value':
          return ((b.usdValue || 0) - (a.usdValue || 0)) * multiplier;
        case 'amount':
          return (parseFloat(b.amount) - parseFloat(a.amount)) * multiplier;
        case 'alphabetical':
          return a.symbol.localeCompare(b.symbol) * multiplier;
        default:
          return 0;
      }
    });

    return filtered;
  }

  // Utility methods

  private getAlphPriceUSD(): number {
    // Updated fallback price to match system-wide standard
    // TODO: Integrate with Redux pricing system for real-time data
    return 3.80;
  }

  private trackLoadTime(time: number): void {
    this.performanceTracker.loadTimes.push(time);
    
    // Keep only last 100 measurements
    if (this.performanceTracker.loadTimes.length > 100) {
      this.performanceTracker.loadTimes = this.performanceTracker.loadTimes.slice(-50);
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const walletAdapter = new WalletAdapter({
  enablePreloading: true,
  batchSize: 3,
  refreshInterval: 30000,
  enableTransformations: true
});

export default WalletAdapter; 

