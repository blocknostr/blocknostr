import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { TAG_TYPES } from '../types';
import type { WalletConnection } from '../slices/walletConnectionsSlice';
import { NostrEvent } from '@/lib/nostr/types';
import { getApiBaseUrl } from '@/lib/utils/env';

// API Response Types
export interface WalletBalance {
  address: string;
  network: 'Bitcoin' | 'Alephium' | 'Ergo';
  balance: string;
  lockedBalance?: string;
  unconfirmedBalance?: string;
  utxoCount?: number;
  lastUpdated: number;
  usdValue?: number;
  tokens: TokenBalance[];
}

export interface TokenBalance {
  tokenId: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  lockedBalance?: string;
  usdValue?: number;
  logoURI?: string;
  isNFT: boolean;
  metadata?: {
    description?: string;
    image?: string;
    attributes?: Array<{ trait_type: string; value: string }>;
  };
}

export interface WalletInfo {
  address: string;
  network: 'Bitcoin' | 'Alephium' | 'Ergo';
  type: 'watch_only' | 'connected' | 'hardware';
  label?: string;
  balance: WalletBalance;
  transactionCount: number;
  firstTransactionDate?: number;
  lastTransactionDate?: number;
  isActive: boolean;
  riskScore?: number;
  tags: string[];
}

export interface TransactionHistory {
  transactions: WalletTransaction[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
}

// PriceData interface moved to simplifiedPricingService.ts

export interface NetworkStats {
  network: 'Bitcoin' | 'Alephium' | 'Ergo';
  blockHeight: number;
  difficulty: string;
  hashRate: string;
  avgBlockTime: number;
  totalSupply?: string;
  circulatingSupply?: string;
  activeAddresses24h: number;
  transactionCount24h: number;
  avgFee: string;
  lastUpdated: number;
}

export interface WalletAnalytics {
  address: string;
  network: 'Bitcoin' | 'Alephium' | 'Ergo';
  totalValue: number;
  totalTransactions: number;
  totalFees: number;
  profitLoss: number;
  riskScore: number;
  diversificationScore: number;
  activityScore: number;
  holdingPeriod: number;
  topTokens: Array<{
    tokenId: string;
    symbol: string;
    percentage: number;
    value: number;
  }>;
  transactionPatterns: {
    mostActiveHour: number;
    mostActiveDay: string;
    averageTransactionSize: number;
    transactionFrequency: number;
  };
  riskFactors: Array<{
    type: 'concentration' | 'volatility' | 'liquidity' | 'smart_contract';
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
}

export interface StakingInfo {
  address: string;
  network: 'Alephium' | 'Ergo';
  totalStaked: string;
  totalRewards: string;
  stakingPositions: Array<{
    poolId: string;
    poolName: string;
    stakedAmount: string;
    rewards: string;
    apr: number;
    lockPeriod?: number;
    unlockDate?: number;
    status: 'active' | 'pending' | 'unstaking';
  }>;
  estimatedAnnualRewards: string;
  lastUpdated: number;
}

export interface NFTCollection {
  address: string;
  network: 'Bitcoin' | 'Alephium' | 'Ergo';
  nfts: Array<{
    tokenId: string;
    name: string;
    description?: string;
    image: string;
    collection?: string;
    rarity?: string;
    attributes: Array<{ trait_type: string; value: string }>;
    floorPrice?: number;
    lastSalePrice?: number;
    estimatedValue?: number;
  }>;
  totalValue: number;
  totalCount: number;
  collections: Array<{
    name: string;
    count: number;
    floorPrice?: number;
    totalValue: number;
  }>;
}

export interface DeFiPositions {
  address: string;
  network: 'Alephium' | 'Ergo';
  totalValue: number;
  positions: Array<{
    protocol: string;
    type: 'lending' | 'borrowing' | 'liquidity' | 'farming' | 'staking';
    tokens: Array<{
      tokenId: string;
      symbol: string;
      amount: string;
      value: number;
    }>;
    apr?: number;
    rewards?: Array<{
      tokenId: string;
      symbol: string;
      amount: string;
      value: number;
    }>;
    healthFactor?: number;
    liquidationPrice?: number;
    status: 'active' | 'at_risk' | 'liquidated';
  }>;
  totalRewards: number;
  riskLevel: 'low' | 'medium' | 'high';
}

// Query Parameters
export interface WalletQueryParams {
  address: string;
  network?: 'Bitcoin' | 'Alephium' | 'Ergo';
  includeTokens?: boolean;
  includeNFTs?: boolean;
  includeStaking?: boolean;
  includeDeFi?: boolean;
}

export interface TransactionQueryParams {
  address: string;
  network?: 'Bitcoin' | 'Alephium' | 'Ergo';
  page?: number;
  limit?: number;
  cursor?: string;
  type?: WalletTransaction['type'][];
  status?: WalletTransaction['status'][];
  tokenId?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: number;
  endDate?: number;
  sortBy?: 'timestamp' | 'amount' | 'fee';
  sortOrder?: 'asc' | 'desc';
}

// PriceQueryParams moved to simplifiedPricingService.ts

// Base query configuration
const baseQuery = fetchBaseQuery({
  baseUrl: '/api/wallet',
  prepareHeaders: (headers, { getState }) => {
    headers.set('Content-Type', 'application/json');
    
    // Add authentication if available
    const state = getState() as any;
    const authToken = state.auth?.token;
    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`);
    }
    
    // Add request ID for tracking
    headers.set('X-Request-ID', `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
    
    return headers;
  },
  timeout: 30000, // 30 second timeout
});

// Enhanced base query with retry logic and error handling
const baseQueryWithRetry = async (args: any, api: any, extraOptions: any) => {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const result = await baseQuery(args, api, extraOptions);
      
      if (result.error) {
        // Handle specific error codes
        if (result.error.status === 429) {
          // Rate limited - wait and retry
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue;
        }
        
        if (result.error.status >= 500 && attempt < maxRetries - 1) {
          // Server error - retry
          attempt++;
          continue;
        }
      }
      
      return result;
    } catch (error) {
      if (attempt === maxRetries - 1) {
        return { error: { status: 'FETCH_ERROR', error: error.message } };
      }
      attempt++;
    }
  }
};

// Wallet API with comprehensive endpoints
export const walletApi = createApi({
  reducerPath: 'walletApi',
  baseQuery: baseQueryWithRetry,
  tagTypes: [
    TAG_TYPES.WALLET,
    TAG_TYPES.WALLET_TOKEN,
    TAG_TYPES.WALLET_TRANSACTION,
    TAG_TYPES.WALLET_CONNECTION,
    TAG_TYPES.WALLET_BALANCE,
    TAG_TYPES.WALLET_PREFERENCES,
    'WALLET_ANALYTICS',
    'WALLET_STAKING',
    'WALLET_NFT',
    'WALLET_DEFI',
    'NETWORK_STATS',
    'TOKEN_PRICES',
    'CRYPTO_PRICES',
    'ALPH_PRICE',
    'ALPH_PRICE_HISTORY',
  ],
  keepUnusedDataFor: 300, // 5 minutes
  refetchOnMountOrArgChange: 30, // 30 seconds
  endpoints: (builder) => ({
    // Core Wallet Endpoints
    getWalletInfo: builder.query<WalletInfo, WalletQueryParams>({
      query: ({ address, network, includeTokens = true, includeNFTs = false, includeStaking = false, includeDeFi = false }) => ({
        url: `/${network?.toLowerCase() || 'multi'}/${address}`,
        params: {
          include_tokens: includeTokens,
          include_nfts: includeNFTs,
          include_staking: includeStaking,
          include_defi: includeDeFi,
        },
      }),
      providesTags: (result, error, { address, network }) => [
        { type: TAG_TYPES.WALLET, id: `${network}_${address}` },
        { type: TAG_TYPES.WALLET_BALANCE, id: `${network}_${address}` },
      ],
    }),

    getWalletBalance: builder.query<WalletBalance, { address: string; network?: string }>({
      query: ({ address, network }) => ({
        url: `/${network?.toLowerCase() || 'multi'}/${address}/balance`,
      }),
      providesTags: (result, error, { address, network }) => [
        { type: TAG_TYPES.WALLET_BALANCE, id: `${network}_${address}` },
      ],
    }),

    getMultiWalletBalances: builder.query<WalletBalance[], { addresses: string[]; network?: string }>({
      query: ({ addresses, network }) => ({
        url: `/${network?.toLowerCase() || 'multi'}/balances`,
        method: 'POST',
        body: { addresses },
      }),
      providesTags: (result, error, { addresses, network }) =>
        addresses.map(address => ({ type: TAG_TYPES.WALLET_BALANCE, id: `${network}_${address}` })),
    }),

    // Transaction Endpoints
    getWalletTransactions: builder.query<TransactionHistory, TransactionQueryParams>({
      query: ({ address, network, ...params }) => ({
        url: `/${network?.toLowerCase() || 'multi'}/${address}/transactions`,
        params,
      }),
      providesTags: (result, error, { address, network }) => [
        { type: TAG_TYPES.WALLET_TRANSACTION, id: `${network}_${address}` },
      ],
      serializeQueryArgs: ({ queryArgs }) => {
        const { address, network, page, limit, cursor, ...filters } = queryArgs;
        // Create cache key based on address, network, and filters (excluding pagination)
        return `${network}_${address}_${JSON.stringify(filters)}`;
      },
      merge: (currentCache, newItems, { arg }) => {
        if (arg.page === 1 || !arg.page) {
          // First page or refresh - replace cache
          return newItems;
        }
        // Subsequent pages - merge transactions
        return {
          ...newItems,
          transactions: [...currentCache.transactions, ...newItems.transactions],
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.page !== previousArg?.page;
      },
    }),

    getTransactionDetails: builder.query<WalletTransaction, { hash: string; network?: string }>({
      query: ({ hash, network }) => ({
        url: `/${network?.toLowerCase() || 'multi'}/transactions/${hash}`,
      }),
      providesTags: (result, error, { hash }) => [
        { type: TAG_TYPES.WALLET_TRANSACTION, id: hash },
      ],
    }),

    searchTransactions: builder.query<TransactionHistory, { 
      query: string; 
      networks?: string[]; 
      filters?: Partial<TransactionQueryParams> 
    }>({
      query: ({ query, networks, filters }) => ({
        url: '/search/transactions',
        params: {
          q: query,
          networks: networks?.join(','),
          ...filters,
        },
      }),
      providesTags: ['WALLET_SEARCH'],
    }),

    // Token pricing endpoints
    getTokenPrices: builder.query<Record<string, { 
      tokenId: string; 
      price: number; 
      source: string; 
      lastUpdated: number;
    }>, { tokenIds: string[] }>({
      queryFn: async ({ tokenIds }) => {
        try {
          const { getBatchTokenPrices, transformPricesForRedux } = await import('@/api/external/simplePricingService');
          const prices = await getBatchTokenPrices(tokenIds);
          return { data: transformPricesForRedux(prices) };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } };
        }
      },
      providesTags: ['TOKEN_PRICES'],
      keepUnusedDataFor: 300, // 5 minutes for price data
    }),

    // ✅ NEW: CoinGecko pricing endpoints (migrated from coingeckoApi.ts)
    getCryptoMarketData: builder.query<Array<{
      id: string;
      name: string;
      symbol: string;
      price: number;
      priceChange24h: number;
      marketCapRank: number;
    }>, { coinIds: string[] }>({
      queryFn: async ({ coinIds }) => {
        try {
          // ✅ Use environment utility for API base URL
          const apiBaseUrl = getApiBaseUrl('COINGECKO');
          
          console.log(`[RTK Query] Fetching price data for ${coinIds.length} coins from CoinGecko`);
          const response = await fetch(
            `${apiBaseUrl}/coins/markets?vs_currency=usd&ids=${coinIds.join(',')}&order=market_cap_desc&per_page=${coinIds.length}&page=1&sparkline=false&price_change_percentage=24h`
          );
          
          if (!response.ok) {
            throw new Error(`CoinGecko API returned status ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log("[RTK Query] Fetched market data for coins:", data.map((c: any) => c.id));
          
          const formattedData = data.map((coin: any) => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            price: coin.current_price,
            priceChange24h: coin.price_change_percentage_24h,
            marketCapRank: coin.market_cap_rank || 9999
          }));
          
          return { data: formattedData };
        } catch (error) {
          console.error("[RTK Query] Error fetching CoinGecko data:", error);
          
          // Fallback data
          const fallbackData = [
            { id: 'bitcoin', name: 'Bitcoin', symbol: 'btc', price: 110000, priceChange24h: 2.5, marketCapRank: 1 },
            { id: 'ethereum', name: 'Ethereum', symbol: 'eth', price: 2600, priceChange24h: 1.8, marketCapRank: 2 },
            { id: 'alephium', name: 'Alephium', symbol: 'alph', price: 0.44, priceChange24h: 0, marketCapRank: 566 },
            { id: 'ergo', name: 'Ergo', symbol: 'erg', price: 1.42, priceChange24h: -1.2, marketCapRank: 302 },
            { id: 'cardano', name: 'Cardano', symbol: 'ada', price: 0.77, priceChange24h: 0.8, marketCapRank: 8 }
          ];
          
          return { data: fallbackData.filter(coin => coinIds.includes(coin.id)) };
        }
      },
      providesTags: ['CRYPTO_PRICES'],
      keepUnusedDataFor: 300, // 5 minutes for price data
    }),

    getAlephiumPrice: builder.query<{
      price: number;
      priceChange24h: number;
      lastUpdated: Date;
    }, void>({
      queryFn: async () => {
        try {
          // ✅ Use environment utility for API base URL
          const apiBaseUrl = getApiBaseUrl('COINGECKO');
          const ALPH_COINGECKO_ID = "alephium";
          
          const response = await fetch(
            `${apiBaseUrl}/simple/price?ids=${ALPH_COINGECKO_ID}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`
          );
          
          if (!response.ok) {
            throw new Error(`Failed to fetch price data: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          
          const price = data.alephium.usd || 0;
          const priceChange24h = data.alephium.usd_24h_change || 0;
          const lastUpdated = new Date(data.alephium.last_updated_at ? data.alephium.last_updated_at * 1000 : Date.now());
          
          return { data: { price, priceChange24h, lastUpdated } };
        } catch (error) {
          console.error("[RTK Query] Error fetching Alephium price:", error);
          return { data: { price: 0.44, priceChange24h: 0, lastUpdated: new Date() } };
        }
      },
      providesTags: ['ALPH_PRICE'],
      keepUnusedDataFor: 300, // 5 minutes for price data
    }),

    getAlephiumPriceHistory: builder.query<Array<{
      timestamp: number;
      price: number;
    }>, { days?: number }>({
      queryFn: async ({ days = 7 }) => {
        try {
          // ✅ Use environment utility for API base URL
          const apiBaseUrl = getApiBaseUrl('COINGECKO');
          const ALPH_COINGECKO_ID = "alephium";
          
          // Use lower resolution for longer time periods to reduce data size
          const resolution = days > 30 ? 'daily' : days > 7 ? '4h' : '1h';
          
          const response = await fetch(
            `${apiBaseUrl}/coins/${ALPH_COINGECKO_ID}/market_chart?vs_currency=usd&days=${days}&interval=${resolution}`
          );
          
          if (!response.ok) {
            throw new Error(`Failed to fetch price history: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          
          // Transform data to our preferred format
          const priceHistory = data.prices.map(([timestamp, price]: [number, number]) => ({
            timestamp,
            price
          }));
          
          return { data: priceHistory };
        } catch (error) {
          console.error("[RTK Query] Error fetching Alephium price history:", error);
          return { data: [] }; // Return empty array on error
        }
      },
      providesTags: ['ALPH_PRICE_HISTORY'],
      keepUnusedDataFor: 600, // 10 minutes for historical data
    }),

    getTokenInfo: builder.query<TokenBalance & { totalSupply?: string; holders?: number }, { 
      tokenId: string; 
      network?: string 
    }>({
      query: ({ tokenId, network }) => ({
        url: `/${network?.toLowerCase() || 'multi'}/tokens/${tokenId}`,
      }),
      providesTags: (result, error, { tokenId }) => [
        { type: TAG_TYPES.WALLET_TOKEN, id: tokenId },
      ],
    }),

    // Analytics Endpoints
    getWalletAnalytics: builder.query<WalletAnalytics, { 
      address: string; 
      network?: string; 
      timeframe?: '24h' | '7d' | '30d' | '1y' | 'all' 
    }>({
      query: ({ address, network, timeframe = '30d' }) => ({
        url: `/${network?.toLowerCase() || 'multi'}/${address}/analytics`,
        params: { timeframe },
      }),
      providesTags: (result, error, { address, network }) => [
        { type: 'WALLET_ANALYTICS', id: `${network}_${address}` },
      ],
    }),

    getPortfolioAnalytics: builder.query<{
      totalValue: number;
      totalPnL: number;
      diversification: number;
      riskScore: number;
      wallets: WalletAnalytics[];
    }, { addresses: string[]; networks?: string[] }>({
      query: ({ addresses, networks }) => ({
        url: '/analytics/portfolio',
        method: 'POST',
        body: { addresses, networks },
      }),
      providesTags: ['PORTFOLIO_ANALYTICS'],
    }),

    // Staking Endpoints
    getStakingInfo: builder.query<StakingInfo, { address: string; network: 'Alephium' | 'Ergo' }>({
      query: ({ address, network }) => ({
        url: `/${network.toLowerCase()}/${address}/staking`,
      }),
      providesTags: (result, error, { address, network }) => [
        { type: 'WALLET_STAKING', id: `${network}_${address}` },
      ],
    }),

    getStakingPools: builder.query<Array<{
      poolId: string;
      name: string;
      apr: number;
      totalStaked: string;
      minStake: string;
      lockPeriod?: number;
      status: 'active' | 'inactive';
    }>, { network: 'Alephium' | 'Ergo' }>({
      query: ({ network }) => ({
        url: `/${network.toLowerCase()}/staking/pools`,
      }),
      providesTags: (result, error, { network }) => [
        { type: 'STAKING_POOLS', id: network },
      ],
    }),

    // NFT Endpoints
    getWalletNFTs: builder.query<NFTCollection, { 
      address: string; 
      network?: string;
      includeMetadata?: boolean;
      includeFloorPrices?: boolean;
    }>({
      query: ({ address, network, includeMetadata = true, includeFloorPrices = false }) => ({
        url: `/${network?.toLowerCase() || 'multi'}/${address}/nfts`,
        params: {
          include_metadata: includeMetadata,
          include_floor_prices: includeFloorPrices,
        },
      }),
      providesTags: (result, error, { address, network }) => [
        { type: 'WALLET_NFT', id: `${network}_${address}` },
      ],
    }),

    getNFTDetails: builder.query<{
      tokenId: string;
      name: string;
      description?: string;
      image: string;
      attributes: Array<{ trait_type: string; value: string }>;
      collection?: string;
      owner: string;
      mintDate?: number;
      transferHistory: Array<{
        from: string;
        to: string;
        timestamp: number;
        price?: number;
      }>;
    }, { tokenId: string; network?: string }>({
      query: ({ tokenId, network }) => ({
        url: `/${network?.toLowerCase() || 'multi'}/nfts/${tokenId}`,
      }),
      providesTags: (result, error, { tokenId }) => [
        { type: 'NFT_DETAILS', id: tokenId },
      ],
    }),

    // DeFi Endpoints
    getDeFiPositions: builder.query<DeFiPositions, { address: string; network: 'Alephium' | 'Ergo' }>({
      query: ({ address, network }) => ({
        url: `/${network.toLowerCase()}/${address}/defi`,
      }),
      providesTags: (result, error, { address, network }) => [
        { type: 'WALLET_DEFI', id: `${network}_${address}` },
      ],
    }),

    getDeFiProtocols: builder.query<Array<{
      name: string;
      network: string;
      tvl: number;
      apr: number;
      supportedTokens: string[];
      riskLevel: 'low' | 'medium' | 'high';
    }>, { network?: string }>({
      query: ({ network }) => ({
        url: '/defi/protocols',
        params: { network },
      }),
      providesTags: ['DEFI_PROTOCOLS'],
    }),

    // Network and Utility Endpoints
    getNetworkStats: builder.query<NetworkStats, { network: 'Bitcoin' | 'Alephium' | 'Ergo' }>({
      query: ({ network }) => ({
        url: `/${network.toLowerCase()}/stats`,
      }),
      providesTags: (result, error, { network }) => [
        { type: 'NETWORK_STATS', id: network },
      ],
    }),

    validateAddress: builder.query<{ isValid: boolean; network?: string; type?: string }, { 
      address: string; 
      network?: string 
    }>({
      query: ({ address, network }) => ({
        url: '/validate',
        params: { address, network },
      }),
    }),

    estimateTransactionFee: builder.query<{
      estimatedFee: string;
      feeRate: string;
      gasLimit?: string;
      gasPrice?: string;
    }, {
      from: string;
      to: string;
      amount: string;
      tokenId?: string;
      network: string;
      priority?: 'low' | 'medium' | 'high';
    }>({
      query: (params) => ({
        url: '/estimate-fee',
        method: 'POST',
        body: params,
      }),
    }),

    // Connection Management
    getWalletConnections: builder.query<WalletConnection[], { address?: string }>({
      query: ({ address }) => ({
        url: '/connections',
        params: { address },
      }),
      providesTags: [TAG_TYPES.WALLET_CONNECTION],
    }),

    createConnection: builder.mutation<WalletConnection, {
      walletAddress: string;
      network: string;
      type: string;
      config?: any;
    }>({
      query: (params) => ({
        url: '/connections',
        method: 'POST',
        body: params,
      }),
      invalidatesTags: [TAG_TYPES.WALLET_CONNECTION],
    }),

    updateConnection: builder.mutation<WalletConnection, {
      connectionId: string;
      updates: Partial<WalletConnection>;
    }>({
      query: ({ connectionId, updates }) => ({
        url: `/connections/${connectionId}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: [TAG_TYPES.WALLET_CONNECTION],
    }),

    deleteConnection: builder.mutation<void, string>({
      query: (connectionId) => ({
        url: `/connections/${connectionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [TAG_TYPES.WALLET_CONNECTION],
    }),

    // Batch Operations
    batchGetWalletData: builder.query<{
      wallets: Record<string, WalletInfo>;
      totalValue: number;
      lastUpdated: number;
    }, {
      addresses: Array<{ address: string; network: string }>;
      includeAnalytics?: boolean;
    }>({
      query: ({ addresses, includeAnalytics = false }) => ({
        url: '/batch/wallets',
        method: 'POST',
        body: { addresses, include_analytics: includeAnalytics },
      }),
      providesTags: (result, error, { addresses }) =>
        addresses.map(({ address, network }) => ({ 
          type: TAG_TYPES.WALLET, 
          id: `${network}_${address}` 
        })),
    }),

    // Real-time Subscriptions (WebSocket endpoints)
    subscribeToWalletUpdates: builder.query<{
      type: 'balance_update' | 'transaction' | 'price_update';
      data: any;
      timestamp: number;
    }, { addresses: string[]; networks?: string[] }>({
      query: ({ addresses, networks }) => ({
        url: '/subscribe/wallet-updates',
        method: 'POST',
        body: { addresses, networks },
      }),
      // This would typically be handled by WebSocket middleware
      async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
        // WebSocket connection logic would go here
        try {
          await cacheDataLoaded;
          
          // Simulate WebSocket connection
          const ws = new WebSocket(`wss://api.blocknostr.com/ws/wallet-updates`);
          
          ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            updateCachedData((draft) => {
              Object.assign(draft, data);
            });
          };
          
          await cacheEntryRemoved;
          ws.close();
        } catch {
          // Handle connection errors
        }
      },
    }),

    // Export and Reporting
    exportWalletData: builder.mutation<{ downloadUrl: string; expiresAt: number }, {
      addresses: string[];
      format: 'csv' | 'json' | 'pdf';
      includeTransactions?: boolean;
      includeAnalytics?: boolean;
      dateRange?: { start: number; end: number };
    }>({
      query: (params) => ({
        url: '/export',
        method: 'POST',
        body: params,
      }),
    }),

    generateTaxReport: builder.mutation<{ reportUrl: string; expiresAt: number }, {
      addresses: string[];
      taxYear: number;
      country: string;
      includeStaking?: boolean;
      includeDeFi?: boolean;
    }>({
      query: (params) => ({
        url: '/reports/tax',
        method: 'POST',
        body: params,
      }),
    }),
  }),
});

// Export hooks for all endpoints
export const {
  // Core Wallet Hooks
  useGetWalletInfoQuery,
  useLazyGetWalletInfoQuery,
  useGetWalletBalanceQuery,
  useLazyGetWalletBalanceQuery,
  useGetMultiWalletBalancesQuery,
  
  // Transaction Hooks
  useGetWalletTransactionsQuery,
  useLazyGetWalletTransactionsQuery,
  useGetTransactionDetailsQuery,
  useSearchTransactionsQuery,
  
  // Token and Price Hooks
  useGetTokenPricesQuery,
  useLazyGetTokenPricesQuery,
  useGetTokenInfoQuery,
  
  // ✅ NEW: CoinGecko Price Hooks (migrated from coingeckoApi.ts)
  useGetCryptoMarketDataQuery,
  useLazyGetCryptoMarketDataQuery,
  useGetAlephiumPriceQuery,
  useLazyGetAlephiumPriceQuery,
  useGetAlephiumPriceHistoryQuery,
  useLazyGetAlephiumPriceHistoryQuery,
  
  // Analytics Hooks
  useGetWalletAnalyticsQuery,
  useGetPortfolioAnalyticsQuery,
  
  // Staking Hooks
  useGetStakingInfoQuery,
  useGetStakingPoolsQuery,
  
  // NFT Hooks
  useGetWalletNFTsQuery,
  useGetNFTDetailsQuery,
  
  // DeFi Hooks
  useGetDeFiPositionsQuery,
  useGetDeFiProtocolsQuery,
  
  // Network and Utility Hooks
  useGetNetworkStatsQuery,
  useValidateAddressQuery,
  useEstimateTransactionFeeQuery,
  
  // Connection Hooks
  useGetWalletConnectionsQuery,
  useCreateConnectionMutation,
  useUpdateConnectionMutation,
  useDeleteConnectionMutation,
  
  // Batch Operations
  useBatchGetWalletDataQuery,
  
  // Real-time Subscriptions
  useSubscribeToWalletUpdatesQuery,
  useSubscribeToPriceUpdatesQuery,
  
  // Export and Reporting
  useExportWalletDataMutation,
  useGenerateTaxReportMutation,
} = walletApi;

// Utility functions for cache management
export const walletApiUtils = {
  // Prefetch wallet data
  prefetchWalletData: (addresses: Array<{ address: string; network: string }>) => {
    return walletApi.util.prefetch('batchGetWalletData', { addresses }, { force: false });
  },
  
  // Invalidate wallet cache
  invalidateWallet: (address: string, network: string) => {
    return walletApi.util.invalidateTags([
      { type: TAG_TYPES.WALLET, id: `${network}_${address}` },
      { type: TAG_TYPES.WALLET_BALANCE, id: `${network}_${address}` },
      { type: TAG_TYPES.WALLET_TRANSACTION, id: `${network}_${address}` },
    ]);
  },
  
  // Update wallet balance in cache
  updateWalletBalance: (address: string, network: string, balance: Partial<WalletBalance>) => {
    return walletApi.util.updateQueryData('getWalletBalance', { address, network }, (draft) => {
      Object.assign(draft, balance);
    });
  },
  
  // Add transaction to cache
  addTransactionToCache: (address: string, network: string, transaction: WalletTransaction) => {
    return walletApi.util.updateQueryData(
      'getWalletTransactions', 
      { address, network, page: 1 }, 
      (draft) => {
        draft.transactions.unshift(transaction);
        draft.totalCount += 1;
      }
    );
  },
};

export default walletApi; 

