
/**
 * Token metadata service for Alephium tokens
 * Fetches and caches token information from the official Alephium token list
 */
import { TokenInfo, TokenList } from '@alephium/token-list';
import { NodeProvider, node } from '@alephium/web3';

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

// Official Alephium token list URL
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
    // Try to fetch from the Alephium token list first (SDK method)
    const tokenMap: Record<string, TokenMetadata> = {};
    
    try {
      const tokenList = await import('@alephium/token-list');
      const tokens = tokenList.mainnetTokens.tokens;
      
      console.log("SDK token list fetched:", tokens.length);
      
      tokens.forEach((token: TokenInfo) => {
        tokenMap[token.id] = {
          id: token.id,
          name: token.name,
          symbol: token.symbol,
          decimals: token.decimals,
          logoURI: token.logoURI,
          description: token.description
        };
      });
    } catch (sdkError) {
      console.warn("Error fetching SDK token list, falling back to GitHub URL:", sdkError);
      
      // Fallback: Fetch from GitHub directly
      const response = await fetch(TOKEN_LIST_URL);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch token list: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("GitHub token list fetched:", data.tokens.length);
      
      data.tokens.forEach((token: TokenMetadata) => {
        tokenMap[token.id] = token;
      });
    }
    
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
 * Gets metadata for a specific token ID directly from the node if possible
 */
export const getTokenMetadata = async (tokenId: string, nodeProvider?: NodeProvider): Promise<TokenMetadata | undefined> => {
  try {
    // First check our cache
    const tokenMap = await fetchTokenList();
    if (tokenMap[tokenId]) {
      return tokenMap[tokenId];
    }
    
    // If not in cache, try to fetch directly from node
    const provider = nodeProvider || new NodeProvider('https://node.mainnet.alephium.org');
    
    try {
      const tokenInfo = await provider.tokens.getTokensTokenId(tokenId);
      
      if (tokenInfo) {
        return {
          id: tokenId,
          name: tokenInfo.name || `Token ${tokenId.substring(0, 6)}`,
          symbol: tokenInfo.symbol || `TOKEN`,
          decimals: tokenInfo.decimals || 0,
          description: "Token fetched from Alephium node"
        };
      }
    } catch (nodeError) {
      console.warn(`Could not fetch token ${tokenId} from node:`, nodeError);
    }
    
    // Fallback to default data
    return getFallbackTokenData(tokenId);
  } catch (error) {
    console.error(`Error in getTokenMetadata for ${tokenId}:`, error);
    return getFallbackTokenData(tokenId);
  }
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
