/**
 * WalletDataManager - Service for managing wallet data
 * Handles data fetching, caching, and subscription management
 */

import { getAddressTokens, getAddressNFTs, EnrichedToken } from '../api/alephiumApi';
import { getAddressBalance } from '../api/cachedAlephiumApi';

// Cache expiry time in milliseconds (30 minutes)
const CACHE_EXPIRY = 30 * 60 * 1000;

export interface WalletData {
  address: string;
  tokens: EnrichedToken[];
  nfts: EnrichedToken[];
  balance: {
    alph: string;
    lockedAlph: string;
  };
  lastUpdated: number;
  isLoading: boolean;
  error: string | null;
}

export interface DataManagerStats {
  cacheSize: number;
  hitRate: number;
  activeFetches: number;
  lastReset: number;
}

type SubscriptionCallback = (data: WalletData) => void;

class WalletDataManager {
  private cache: Map<string, WalletData> = new Map();
  private subscriptions: Map<string, Set<SubscriptionCallback>> = new Map();
  private activeFetches: Set<string> = new Set();
  private stats = {
    hits: 0,
    misses: 0,
    lastReset: Date.now(),
    fetchCount: 0,
  };

  /**
   * Get wallet data with caching
   */
  async getWalletData(address: string, forceRefresh = false): Promise<WalletData> {
    // Normalize address to prevent case sensitivity issues
    const normalizedAddress = address.toLowerCase();
    
    // Check if data is in cache and not expired
    const cachedData = this.cache.get(normalizedAddress);
    const now = Date.now();
    
    if (
      !forceRefresh &&
      cachedData && 
      now - cachedData.lastUpdated < CACHE_EXPIRY
    ) {
      this.stats.hits++;
      console.log(`[WalletDataManager] Cache hit for ${normalizedAddress}`);
      return cachedData;
    }
    
    this.stats.misses++;
    
    // If there's an ongoing fetch for this address, wait for it
    if (this.activeFetches.has(normalizedAddress)) {
      console.log(`[WalletDataManager] Waiting for ongoing fetch for ${normalizedAddress}`);
      return new Promise((resolve) => {
        const checkCache = () => {
          if (!this.activeFetches.has(normalizedAddress)) {
            const data = this.cache.get(normalizedAddress);
            if (data) {
              resolve(data);
            } else {
              // This should not happen but just in case
              resolve(this.createEmptyWalletData(normalizedAddress));
            }
          } else {
            setTimeout(checkCache, 100);
          }
        };
        checkCache();
      });
    }

    // Mark as fetching
    this.activeFetches.add(normalizedAddress);
    this.stats.fetchCount++;
    
    try {
      // Fetch new data
      console.log(`[WalletDataManager] Fetching fresh data for ${normalizedAddress}`);
      
      // Create initial data structure with loading state
      const initialData: WalletData = {
        address: normalizedAddress,
        tokens: [],
        nfts: [],
        balance: { alph: '0', lockedAlph: '0' },
        lastUpdated: now,
        isLoading: true,
        error: null
      };
      
      // Update cache with loading state
      this.cache.set(normalizedAddress, initialData);
      
      // Fetch data in parallel
      const [tokens, nfts, balance] = await Promise.all([
        getAddressTokens(normalizedAddress),
        getAddressNFTs(normalizedAddress),
        getAddressBalance(normalizedAddress)
      ]);
      
      // Create updated wallet data
      const walletData: WalletData = {
        address: normalizedAddress,
        tokens,
        nfts,
        balance: {
          alph: balance.balance,
          lockedAlph: balance.lockedBalance
        },
        lastUpdated: Date.now(),
        isLoading: false,
        error: null
      };
      
      // Update cache
      this.cache.set(normalizedAddress, walletData);
      
      // Notify subscribers
      this.notifySubscribers(normalizedAddress, walletData);
      
      return walletData;
    } catch (error) {
      console.error(`[WalletDataManager] Error fetching data for ${normalizedAddress}:`, error);
      
      const errorData: WalletData = {
        address: normalizedAddress,
        tokens: [],
        nfts: [],
        balance: { alph: '0', lockedAlph: '0' },
        lastUpdated: Date.now(),
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      // Update cache with error state
      this.cache.set(normalizedAddress, errorData);
      
      // Notify subscribers about error
      this.notifySubscribers(normalizedAddress, errorData);
      
      return errorData;
    } finally {
      // Remove from active fetches
      this.activeFetches.delete(normalizedAddress);
    }
  }

  /**
   * Get wallet data for multiple addresses efficiently
   */
  async getBatchWalletData(addresses: string[], forceRefresh = false): Promise<Map<string, WalletData>> {
    const result = new Map<string, WalletData>();
    
    // Process addresses in parallel with concurrency control
    await Promise.all(
      addresses.map(async (address) => {
        try {
          const data = await this.getWalletData(address, forceRefresh);
          result.set(address, data);
        } catch (error) {
          console.error(`[WalletDataManager] Error in batch get for ${address}:`, error);
          result.set(address, this.createEmptyWalletData(address));
        }
      })
    );
    
    return result;
  }

  /**
   * Preload wallet data without blocking
   */
  async preloadWalletData(addresses: string[]): Promise<void> {
    console.log(`[WalletDataManager] Preloading data for ${addresses.length} addresses`);
    
    // Use lower priority loading to not block main operations
    setTimeout(() => {
      addresses.forEach(address => {
        this.getWalletData(address).catch(error => {
          console.error(`[WalletDataManager] Error preloading data for ${address}:`, error);
        });
      });
    }, 0);
  }

  /**
   * Subscribe to wallet data updates
   */
  subscribe(address: string, callback: SubscriptionCallback): () => void {
    const normalizedAddress = address.toLowerCase();
    
    // Create subscription set if it doesn't exist
    if (!this.subscriptions.has(normalizedAddress)) {
      this.subscriptions.set(normalizedAddress, new Set());
    }
    
    // Add callback to subscription set
    this.subscriptions.get(normalizedAddress)?.add(callback);
    
    // Initial callback with current data if available
    const currentData = this.cache.get(normalizedAddress);
    if (currentData) {
      callback(currentData);
    } else {
      // Trigger a data fetch if no data is available
      this.getWalletData(normalizedAddress).catch(console.error);
    }
    
    // Return unsubscribe function
    return () => {
      this.subscriptions.get(normalizedAddress)?.delete(callback);
    };
  }

  /**
   * Clear cached wallet data
   */
  clearCache(address?: string): void {
    if (address) {
      const normalizedAddress = address.toLowerCase();
      this.cache.delete(normalizedAddress);
      console.log(`[WalletDataManager] Cleared cache for ${normalizedAddress}`);
    } else {
      this.cache.clear();
      this.stats = {
        hits: 0,
        misses: 0,
        lastReset: Date.now(),
        fetchCount: 0,
      };
      console.log('[WalletDataManager] Cleared entire cache');
    }
  }

  /**
   * Get statistics about the data manager
   */
  getStats(): DataManagerStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    
    return {
      cacheSize: this.cache.size,
      hitRate: hitRate,
      activeFetches: this.activeFetches.size,
      lastReset: this.stats.lastReset
    };
  }

  /**
   * Create empty wallet data for an address
   */
  private createEmptyWalletData(address: string): WalletData {
    return {
      address,
      tokens: [],
      nfts: [],
      balance: { alph: '0', lockedAlph: '0' },
      lastUpdated: Date.now(),
      isLoading: false,
      error: null
    };
  }

  /**
   * Notify subscribers of data updates
   */
  private notifySubscribers(address: string, data: WalletData): void {
    const callbacks = this.subscriptions.get(address);
    if (callbacks && callbacks.size > 0) {
      console.log(`[WalletDataManager] Notifying ${callbacks.size} subscribers for ${address}`);
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[WalletDataManager] Error in subscription callback:', error);
        }
      });
    }
  }
}

// Singleton instance
export const walletDataManager = new WalletDataManager(); 
