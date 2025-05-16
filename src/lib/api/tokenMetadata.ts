
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
    console.log("Fetched token list:", data);
    
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
    
    // If token list fetch fails, use hardcoded data for the two known tokens
    // This is a fallback to ensure the app works even when the API is down
    if (!tokenCache) {
      tokenCache = {
        "f4ba66a73c735e1866027e8e1e5823fbf294a0b013a675d3a7d9df112f4ebd00": {
          id: "f4ba66a73c735e1866027e8e1e5823fbf294a0b013a675d3a7d9df112f4ebd00",
          name: "Token f4ba",
          symbol: "TOKEN-f4ba",
          decimals: 5, // Based on explorer data
          logoURI: "https://raw.githubusercontent.com/alephium/token-list/master/logos/unknown.png"
        },
        "d87f077547df8783598e9e35d7bb22c59adc37c5fee288f2a103b8d14c1d2000": {
          id: "d87f077547df8783598e9e35d7bb22c59adc37c5fee288f2a103b8d14c1d2000",
          name: "Token d87f",
          symbol: "TOKEN-d87f",
          decimals: 9, // Based on explorer data
          logoURI: "https://raw.githubusercontent.com/alephium/token-list/master/logos/unknown.png"
        }
      };
    }
    
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
 * Divides the raw integer amount by 10^decimals
 */
export const formatTokenAmount = (amount: string | number, decimals: number = 0): string => {
  try {
    // Convert to BigInt to handle large numbers accurately
    const bigAmount = typeof amount === 'string' ? BigInt(amount) : BigInt(Math.floor(amount));

    if (decimals === 0) {
      return bigAmount.toString();
    }

    // Calculate the divisor (10^decimals)
    const divisor = BigInt(10) ** BigInt(decimals);
    
    // Integer division for the whole number part
    const wholePart = bigAmount / divisor;
    
    // Modulo to get the fractional part
    const fractionalBigInt = bigAmount % divisor;
    
    // Convert the fractional part to a string with leading zeros
    let fractionalStr = fractionalBigInt.toString();
    while (fractionalStr.length < decimals) {
      fractionalStr = '0' + fractionalStr;
    }
    
    // Trim trailing zeros from the fractional part
    while (fractionalStr.length > 0 && fractionalStr.endsWith('0')) {
      fractionalStr = fractionalStr.slice(0, -1);
    }
    
    // Build the final string representation
    let result = wholePart.toString();
    if (fractionalStr.length > 0) {
      result += '.' + fractionalStr;
    }
    
    // Format with number separators
    return Number(result).toLocaleString(undefined, {
      maximumFractionDigits: decimals
    });
  } catch (error) {
    console.error("Error formatting token amount:", error, amount, decimals);
    return amount.toString();
  }
};

/**
 * Default fallback token data
 */
export const getFallbackTokenData = (tokenId: string): TokenMetadata => {
  // Check for known tokens that might not be in the token list
  if (tokenId === "f4ba66a73c735e1866027e8e1e5823fbf294a0b013a675d3a7d9df112f4ebd00") {
    return {
      id: tokenId,
      name: "TOKEN-f4ba",
      symbol: "TOKEN-f4ba",
      decimals: 5, // Based on explorer data
      logoURI: "https://raw.githubusercontent.com/alephium/token-list/master/logos/unknown.png"
    };
  }
  
  if (tokenId === "d87f077547df8783598e9e35d7bb22c59adc37c5fee288f2a103b8d14c1d2000") {
    return {
      id: tokenId,
      name: "TOKEN-d87f",
      symbol: "TOKEN-d87f",
      decimals: 9, // Based on explorer data
      logoURI: "https://raw.githubusercontent.com/alephium/token-list/master/logos/unknown.png"
    };
  }

  return {
    id: tokenId,
    name: `Unknown Token (${tokenId.substring(0, 6)}...)`,
    symbol: `TOKEN-${tokenId.substring(0, 4)}`,
    decimals: 0,
    logoURI: "https://raw.githubusercontent.com/alephium/token-list/master/logos/unknown.png"
  };
};
