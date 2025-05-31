import { 
  getAddressBalance as originalGetAddressBalance,
  getAddressTransactions as originalGetAddressTransactions,
  getAddressTokens as originalGetAddressTokens,
  getAddressUtxos as originalGetAddressUtxos,
  type EnrichedToken
} from './alephiumApi';
import { rateLimitedApiCall } from './rateLimitedApi';

// Cache TTL configurations (in milliseconds)
const CACHE_TTLS = {
  balance: 10 * 60 * 1000,      // 10 minutes
  transactions: 15 * 60 * 1000,  // 15 minutes
  tokens: 20 * 60 * 1000,       // 20 minutes
  utxos: 15 * 60 * 1000,        // 15 minutes
};

/**
 * Rate-limited and cached version of getAddressBalance
 */
export const getAddressBalance = async (address: string) => {
  return rateLimitedApiCall(
    'balance',
    () => originalGetAddressBalance(address),
    `balance:${address}`,
    CACHE_TTLS.balance
  );
};

/**
 * Rate-limited and cached version of getAddressTransactions
 */
export const getAddressTransactions = async (address: string, limit = 20) => {
  return rateLimitedApiCall(
    'transactions',
    () => originalGetAddressTransactions(address, limit),
    `transactions:${address}:${limit}`,
    CACHE_TTLS.transactions
  );
};

/**
 * Rate-limited and cached version of getAddressTokens
 */
export const getAddressTokens = async (address: string, options?: { skipNFTMetadata?: boolean }): Promise<EnrichedToken[]> => {
  const cacheKey = options?.skipNFTMetadata ? `tokens:${address}:noNFTMeta` : `tokens:${address}`;
  return rateLimitedApiCall(
    'tokens',
    () => originalGetAddressTokens(address, options),
    cacheKey,
    CACHE_TTLS.tokens
  );
};

/**
 * Rate-limited and cached version of getAddressUtxos
 */
export const getAddressUtxos = async (address: string) => {
  return rateLimitedApiCall(
    'utxos',
    () => originalGetAddressUtxos(address),
    `utxos:${address}`,
    CACHE_TTLS.utxos
  );
};

/**
 * Batch fetch multiple wallet data with intelligent scheduling
 */
export const batchFetchWalletData = async (addresses: string[], options?: { skipNFTMetadata?: boolean }) => {
  const results = {
    balances: new Map<string, any>(),
    tokens: new Map<string, EnrichedToken[]>(),
    errors: new Map<string, string>()
  };

  // Process addresses with delays to avoid rate limiting
  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];
    
    try {
            // Add minimal delay between requests (reduced from 500ms to 100ms)      if (i > 0) {        await new Promise(resolve => setTimeout(resolve, 100));      }

      // Fetch balance and tokens in parallel for each address
      const [balance, tokens] = await Promise.allSettled([
        getAddressBalance(address),
        getAddressTokens(address, options)
      ]);

      if (balance.status === 'fulfilled') {
        results.balances.set(address, balance.value);
      } else {
        results.errors.set(address, `Balance: ${balance.reason?.message || 'Unknown error'}`);
      }

      if (tokens.status === 'fulfilled') {
        results.tokens.set(address, tokens.value);
      } else {
        results.errors.set(address, `Tokens: ${tokens.reason?.message || 'Unknown error'}`);
      }

    } catch (error: any) {
      results.errors.set(address, error.message || 'Unknown error');
    }
  }

  return results;
};

/**
 * Safe wallet refresh that won't spam the API
 */
export const safeRefreshWallet = async (address: string) => {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  try {
    console.log(`[SafeRefresh] Starting refresh for ${address}`);
    
        // Fetch data sequentially with minimal delays    const balance = await getAddressBalance(address);    await delay(200); // Reduced from 1000ms to 200ms        const tokens = await getAddressTokens(address);    await delay(200); // Reduced from 1000ms to 200ms        const transactions = await getAddressTransactions(address, 10);
    
    console.log(`[SafeRefresh] Completed refresh for ${address}`);
    
    return {
      balance,
      tokens,
      transactions,
      timestamp: Date.now()
    };
  } catch (error: any) {
    console.error(`[SafeRefresh] Failed to refresh ${address}:`, error.message);
    throw error;
  }
}; 

