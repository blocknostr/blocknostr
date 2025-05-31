/**
 * Simple Pricing Service - Redux-compatible, CoinGecko-only pricing API
 * Eliminates over-engineering and multiple APIs while providing reliable price data
 */

export interface TokenPrice {
  tokenId: string;
  symbol: string;
  price: number;
  source: 'coingecko' | 'estimate';
  lastUpdated: number;
}

// Simple 5-minute cache - single layer only
const cache = new Map<string, { data: TokenPrice; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// CoinGecko API constants
const COINGECKO_API_BASE = "https://api.coingecko.com/api/v3";
const ALPH_COINGECKO_ID = "alephium";

/**
 * Get ALPH price from CoinGecko directly
 */
const fetchAlphiumPriceFromCoinGecko = async (): Promise<{ price: number; priceChange24h: number }> => {
  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=${ALPH_COINGECKO_ID}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch price data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    const price = data.alephium.usd || 0;
    const priceChange24h = data.alephium.usd_24h_change || 0;
    
    return { price, priceChange24h };
  } catch (error) {
    console.error("[SimplePricing] Error fetching Alephium price from CoinGecko:", error);
    return { price: 0.44, priceChange24h: 0 }; // Fallback price
  }
};

/**
 * Get ALPH price with simple caching - CoinGecko only
 */
export const getAlphPrice = async (): Promise<number> => {
  const cached = cache.get('ALPH');
  if (cached && Date.now() < cached.expires) {
    console.log('[SimplePricing] Using cached ALPH price:', cached.data.price);
    return cached.data.price;
  }

  try {
    console.log('[SimplePricing] Fetching ALPH price from CoinGecko...');
    const coingeckoData = await fetchAlphiumPriceFromCoinGecko();
    if (coingeckoData.price > 0) {
      const tokenPrice: TokenPrice = {
        tokenId: 'ALPH',
        symbol: 'ALPH',
        price: coingeckoData.price,
        source: 'coingecko',
        lastUpdated: Date.now()
      };
      cache.set('ALPH', { data: tokenPrice, expires: Date.now() + CACHE_TTL });
      console.log('[SimplePricing] ✅ ALPH price from CoinGecko:', coingeckoData.price);
      return coingeckoData.price;
    }

    console.warn('[SimplePricing] ⚠️ CoinGecko returned invalid ALPH price:', coingeckoData.price);
    return 0.44; // Return fallback price instead of 0
  } catch (error) {
    console.error('[SimplePricing] ❌ Error fetching ALPH price from CoinGecko:', error);
    return 0.44; // Return fallback price instead of 0
  }
};

/**
 * Get multiple token prices - simplified batch operation
 */
export const getBatchTokenPrices = async (tokenIds: string[]): Promise<Record<string, TokenPrice>> => {
  const results: Record<string, TokenPrice> = {};
  const uncachedTokens: string[] = [];

  // Check cache first
  for (const tokenId of tokenIds) {
    const cached = cache.get(tokenId);
    if (cached && Date.now() < cached.expires) {
      results[tokenId] = cached.data;
    } else {
      uncachedTokens.push(tokenId);
    }
  }

  if (uncachedTokens.length === 0) {
    return results;
  }

  // Handle ALPH separately using CoinGecko
  const alphTokens = uncachedTokens.filter(id => id === 'ALPH' || id.toLowerCase() === 'alph');
  const otherTokens = uncachedTokens.filter(id => id !== 'ALPH' && id.toLowerCase() !== 'alph');

  // Get ALPH price from CoinGecko
  if (alphTokens.length > 0) {
    console.log('[SimplePricing] Fetching ALPH for batch request...');
    const alphPrice = await getAlphPrice();
    const alphTokenPrice: TokenPrice = {
      tokenId: 'ALPH',
      symbol: 'ALPH',
      price: alphPrice,
      source: alphPrice > 0 ? 'coingecko' : 'estimate',
      lastUpdated: Date.now()
    };
    results['ALPH'] = alphTokenPrice;
    cache.set('ALPH', { data: alphTokenPrice, expires: Date.now() + CACHE_TTL });
  }

  // For other tokens, we only support ALPH pricing from CoinGecko currently
  // Other Alephium tokens don't have CoinGecko listings, so we set estimate pricing
  if (otherTokens.length > 0) {
    console.log(`[SimplePricing] ⚠️ Found ${otherTokens.length} non-ALPH tokens - setting estimate prices (CoinGecko doesn't support Alephium tokens)`);
    
    for (const tokenId of otherTokens) {
      const tokenPrice: TokenPrice = {
        tokenId,
        symbol: tokenId.substring(0, 8).toUpperCase(),
        price: 0, // No pricing available for Alephium tokens on CoinGecko
        source: 'estimate',
        lastUpdated: Date.now()
      };
      results[tokenId] = tokenPrice;
      cache.set(tokenId, { data: tokenPrice, expires: Date.now() + CACHE_TTL });
    }
  }

  // Set zero price for any missing tokens
  for (const tokenId of uncachedTokens) {
    if (!results[tokenId]) {
      const tokenPrice: TokenPrice = {
        tokenId,
        symbol: tokenId.substring(0, 8).toUpperCase(),
        price: 0,
        source: 'estimate',
        lastUpdated: Date.now()
      };
      results[tokenId] = tokenPrice;
      cache.set(tokenId, { data: tokenPrice, expires: Date.now() + CACHE_TTL });
    }
  }

  return results;
};

/**
 * Clear cache
 */
export const clearPricingCache = (): void => {
  cache.clear();
};

/**
 * Redux-compatible price transformer for RTK Query
 */
export const transformPricesForRedux = (prices: Record<string, TokenPrice>) => {
  const transformed: Record<string, { 
    tokenId: string; 
    price: number; 
    source: string; 
    lastUpdated: number;
  }> = {};

  for (const [tokenId, priceData] of Object.entries(prices)) {
    transformed[tokenId] = {
      tokenId: priceData.tokenId,
      price: priceData.price,
      source: priceData.source,
      lastUpdated: priceData.lastUpdated
    };
  }

  return transformed;
}; 
