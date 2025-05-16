
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
}

interface TokenList {
  networkId: number;
  tokens: TokenMetadata[];
}

const TOKEN_LIST_URL = "https://raw.githubusercontent.com/alephium/token-list/master/tokens.json";
let tokenCache: Record<string, TokenMetadata> | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

/**
 * Fetches the official token list from GitHub
 */
export const fetchTokenList = async (): Promise<Record<string, TokenMetadata>> => {
  const currentTime = Date.now();
  
  // Return cached data if available and not expired
  if (tokenCache && (currentTime - lastFetchTime < CACHE_DURATION)) {
    return tokenCache;
  }
  
  try {
    const response = await fetch(TOKEN_LIST_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch token list: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as TokenList;
    
    // Create a map of token ID to token data for quick lookups
    const tokenMap: Record<string, TokenMetadata> = {};
    data.tokens.forEach(token => {
      tokenMap[token.id] = token;
    });
    
    // Update cache
    tokenCache = tokenMap;
    lastFetchTime = currentTime;
    
    return tokenMap;
  } catch (error) {
    console.error("Error fetching token metadata:", error);
    // Return empty cache or existing cache if available
    return tokenCache || {};
  }
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
 */
export const formatTokenAmount = (amount: number | string, decimals: number = 0): string => {
  const numAmount = typeof amount === 'string' ? Number(amount) : amount;
  
  if (decimals === 0) {
    return numAmount.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
  
  // Convert to proper decimal representation
  const adjustedAmount = numAmount / Math.pow(10, decimals);
  
  // Format with appropriate number of decimal places
  const maxDecimals = Math.min(decimals, 8); // Cap display decimals at 8
  return adjustedAmount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals
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

