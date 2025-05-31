/**
 * Token metadata service for Alephium tokens
 * Fetches and caches token information from the official Alephium token list
 */

// Token interface matching the Alephium token list schema
export interface TokenMetadata {
  id: string;
  name: string;
  nameOnChain?: string;
  symbol: string;
  symbolOnChain?: string;
  decimals: number;
  description?: string;
  logoURI?: string;
  // Additional properties needed for NFT support
  tokenURI?: string;
  uri?: string;
  image?: string;
  imageUrl?: string;
  standard?: string;
  attributes?: any[];
}

interface TokenList {
  networkId: number;
  tokens: TokenMetadata[];
}

// Updated URL to the correct path for the mainnet token list
const TOKEN_LIST_URL = "https://raw.githubusercontent.com/alephium/token-list/master/tokens/mainnet.json";
let tokenCache: Record<string, TokenMetadata> | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

// Enhanced global deduplication system
let pendingFetch: Promise<Record<string, TokenMetadata>> | null = null;
let requestCounter = 0;

/**
 * Fetches the official token list from GitHub
 * Enhanced with global deduplication to prevent multiple concurrent fetches
 */
export const fetchTokenList = async (): Promise<Record<string, TokenMetadata>> => {
  const currentTime = Date.now();
  const requestId = ++requestCounter;
  
  // Return cached data if available and not expired
  if (tokenCache && (currentTime - lastFetchTime < CACHE_DURATION)) {
    console.log(`[TokenMetadata] Using cached token list (request #${requestId}) - ${Object.keys(tokenCache).length} tokens`);
    return tokenCache;
  }
  
  // If there's already a pending fetch, wait for it to complete
  if (pendingFetch) {
    console.log(`[TokenMetadata] Request #${requestId} waiting for pending fetch to complete...`);
    try {
      const result = await pendingFetch;
      console.log(`[TokenMetadata] Request #${requestId} received deduped result - ${Object.keys(result).length} tokens`);
      return result;
    } catch (error) {
      console.warn(`[TokenMetadata] Request #${requestId} - pending fetch failed:`, error);
      // Fall through to create a new request
    }
  }
  
  // Create a new fetch request
  console.log(`[TokenMetadata] Request #${requestId} initiating new fetch from:`, TOKEN_LIST_URL);
  
  pendingFetch = (async () => {
    try {
      // ✅ CORS FIX: Try different request configurations
      const fetchOptions = [
        // First try: Standard CORS request
        {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          mode: 'cors' as RequestMode
        },
        // Second try: No-cors mode (limited response but avoids preflight)
        {
          headers: {
            'Accept': 'application/json'
          },
          mode: 'no-cors' as RequestMode
        },
        // Third try: Minimal headers to avoid CORS preflight
        {
          mode: 'cors' as RequestMode
        }
      ];
      
      let lastError: Error | null = null;
      
      for (let i = 0; i < fetchOptions.length; i++) {
        try {
          console.log(`[TokenMetadata] Request #${requestId} - Trying fetch option ${i + 1}/${fetchOptions.length}`);
          
          const response = await fetch(TOKEN_LIST_URL, fetchOptions[i]);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json() as TokenList;
          console.log(`[TokenMetadata] Request #${requestId} successfully fetched with option ${i + 1}:`, data);
          
          // Create a map of token ID to token data for quick lookups
          const tokenMap: Record<string, TokenMetadata> = {};
          data.tokens.forEach(token => {
            tokenMap[token.id] = token;
          });
          
          // Update global cache
          tokenCache = tokenMap;
          lastFetchTime = currentTime;
          
          console.log(`[TokenMetadata] Request #${requestId} cached ${Object.keys(tokenMap).length} tokens`);
          return tokenMap;
          
        } catch (fetchError: any) {
          lastError = fetchError;
          const errorMessage = fetchError.message || String(fetchError);
          
          // Check for CORS-specific errors
          const isCorsError = errorMessage.includes('CORS') || 
                             errorMessage.includes('Access-Control') || 
                             errorMessage.includes('preflight') ||
                             errorMessage.includes('not allowed by Access-Control-Allow-Headers');
          
          if (isCorsError) {
            console.debug(`[TokenMetadata] Request #${requestId} - CORS error with option ${i + 1}: ${errorMessage}`);
          } else {
            console.warn(`[TokenMetadata] Request #${requestId} - Fetch error with option ${i + 1}: ${errorMessage}`);
          }
          
          // Continue to next option unless this is the last one
          if (i < fetchOptions.length - 1) {
            continue;
          }
        }
      }
      
      // All fetch attempts failed
      console.error(`[TokenMetadata] Request #${requestId} - All fetch attempts failed. Last error:`, lastError);
      
      // ✅ GRACEFUL FALLBACK: Return existing cache or minimal fallback
      if (tokenCache) {
        console.log(`[TokenMetadata] Request #${requestId} - Using stale cached data as fallback (${Object.keys(tokenCache).length} tokens)`);
        return tokenCache;
      } else {
        console.log(`[TokenMetadata] Request #${requestId} - No cache available, returning empty token map`);
        return {};
      }
    } catch (error) {
      console.error(`[TokenMetadata] Request #${requestId} failed:`, error);
      // Return existing cache if available, or empty cache
      return tokenCache || {};
    } finally {
      // Clear the pending fetch so new requests can be made
      pendingFetch = null;
    }
  })();
  
  return pendingFetch;
};

/**
 * Gets metadata for a specific token ID
 */
export const getTokenMetadata = async (tokenId: string): Promise<TokenMetadata | undefined> => {
  const tokenMap = await fetchTokenList();
  return tokenMap[tokenId];
};

/**
 * Formats token amounts based on their decimal places
 * Divides the raw integer amount by 10^decimals
 */
export const formatTokenAmount = (amount: string | number, decimals: number = 0): string => {
  // Convert to BigInt to handle large numbers accurately
  const bigAmount = typeof amount === 'string' ? BigInt(amount) : BigInt(Math.floor(amount));
  
  if (decimals === 0) {
    return bigAmount.toString();
  }
  
  // Convert to string and ensure it has enough leading zeros
  let amountStr = bigAmount.toString();
  // Pad with leading zeros if needed
  while (amountStr.length <= decimals) {
    amountStr = '0' + amountStr;
  }
  
  // Insert decimal point
  const integerPart = amountStr.slice(0, amountStr.length - decimals) || '0';
  const fractionalPart = amountStr.slice(-decimals);
  
  // Format with appropriate number of decimal places, removing trailing zeros
  const formattedAmount = `${integerPart}.${fractionalPart}`;
  
  // Parse as float to remove unnecessary trailing zeros and format with comma separators
  const parsed = parseFloat(formattedAmount);
  return parsed.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
};

/**
 * Default fallback token data
 */
export const getFallbackTokenData = (tokenId: string): TokenMetadata => {
  return {
    id: tokenId,
    name: `Unknown Token (${tokenId.substring(0, 6)}...)`,
    symbol: `TOKEN-${tokenId.substring(0, 4)}`,
    decimals: 0,
    logoURI: "https://raw.githubusercontent.com/alephium/token-list/master/logos/unknown.png"
  };
};

/**
 * Clear the token list cache (for debugging or forced refresh)
 */
export const clearTokenListCache = (): void => {
  tokenCache = null;
  lastFetchTime = 0;
  pendingFetch = null;
  requestCounter = 0;
  console.log('[TokenMetadata] Cache cleared - next request will fetch fresh data');
};

/**
 * Get cache statistics for debugging
 */
export const getTokenCacheStats = (): {
  isCached: boolean;
  tokenCount: number;
  lastFetchTime: number;
  cacheAge: number;
  hasPendingFetch: boolean;
  requestCount: number;
} => {
  return {
    isCached: !!tokenCache,
    tokenCount: tokenCache ? Object.keys(tokenCache).length : 0,
    lastFetchTime,
    cacheAge: Date.now() - lastFetchTime,
    hasPendingFetch: !!pendingFetch,
    requestCount: requestCounter
  };
};

