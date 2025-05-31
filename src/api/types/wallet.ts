export interface SavedWallet {
  address: string;
  label: string;
  dateAdded: number;
  network: WalletType;
  isWatchOnly: boolean;
  // Nostr persistence
  locked?: {
    isLocked: boolean;           // Whether wallet is registered as Nostr event
    eventId?: string;            // Nostr event ID for the wallet registration
    lockedAt?: number;           // Timestamp when wallet was locked
  };
  // Cache metadata
  cacheMetadata?: {
    cachedAt: number;          // When data was cached
    expiresAt: number;         // When cache expires (timestamp)
    lastRefresh: number;       // Last successful data refresh
    refreshInterval: number;   // How often to refresh (milliseconds)
    version: string;           // Cache version for migration support
    isStale: boolean;          // Whether cache needs refresh
    autoRefresh: boolean;      // Whether to auto-refresh on view
    retryCount: number;        // Failed refresh attempts
    maxRetries: number;        // Max retries before marking as stale
  };
}

export type WalletType = "Bitcoin" | "Alephium" | "Ergo";

// Cache configuration interface
export interface WalletCacheConfig {
  defaultTTL: number;          // Default TTL in milliseconds
  maxTTL: number;              // Maximum TTL allowed
  refreshInterval: number;     // How often to check for refresh
  maxRetries: number;          // Max failed attempts before marking stale
  enableAutoRefresh: boolean;  // Whether to auto-refresh data
  enableBackgroundSync: boolean; // Background sync when online
  storageQuotaLimit: number;   // Max storage usage in bytes
}

// Cache status for monitoring
export interface CacheStatus {
  totalWallets: number;
  cachedWallets: number;
  staleWallets: number;
  lastCleanup: number;
  storageUsage: number;
  isOnline: boolean;
}

// Wallet entry for tracking token ownership across multiple wallets
export interface TokenWallet {
  address: string;
  amount: string;
  percentage: number; // percentage of total holdings
  lastUpdated: number;
}

// Enhanced token interface with analytics
export interface EnrichedTokenWithWallets {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  amount: string;
  formattedAmount: string;
  logoURI?: string;
  isNFT: boolean;
  usdValue?: number;
  wallets: TokenWallet[];
  priceSource?: 'market' | 'estimate';
  // NFT properties
  tokenURI?: string;
  imageUrl?: string;
  description?: string;
  attributes?: any[];

  // Analytics
  analytics: {
    price24hChange?: number;
    price7dChange?: number;
    volume24h?: number;
    marketCap?: number;
    rank?: number;
    allTimeHigh?: number;
    allTimeLow?: number;
    priceHistory: PricePoint[];
  };
  // Risk and alerts
  riskLevel: 'low' | 'medium' | 'high' | 'unknown';
  alerts: TokenAlert[];
}

export interface PricePoint {
  timestamp: number;
  price: number;
  volume?: number;
}

export interface TokenAlert {
  id: string;
  type: 'price_target' | 'price_drop' | 'volume_spike' | 'news';
  title: string;
  description: string;
  isActive: boolean;
  threshold?: number;
  createdAt: number;
} 

