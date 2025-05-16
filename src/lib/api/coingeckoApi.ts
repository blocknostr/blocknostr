
/**
 * CoinGecko API service for fetching cryptocurrency price data
 * Uses CoinGecko's free public API
 */

// Price response interface from CoinGecko
interface CoinGeckoPriceResponse {
  [coinId: string]: {
    usd: number;
    usd_24h_change?: number;
    last_updated_at?: number;
  };
}

// Market data response for multiple coins
interface MarketDataResponse {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  image?: string;
}

// Market chart data response interface
interface MarketChartResponse {
  prices: [number, number][];  // [timestamp, price] pairs
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

// Price data with cache TTL for memory storage
interface CachedPriceData {
  data: {
    price: number;
    priceChange24h: number;
    lastUpdated: Date;
  };
  expiresAt: number;
}

// Cached market data for multiple coins
interface CachedMarketData {
  data: {
    id: string;
    name: string;
    symbol: string;
    price: number;
    priceChange24h: number;
    marketCapRank: number;
  }[];
  expiresAt: number;
  coinIds: string[]; // Track which coin IDs are cached
}

// Constants
const COINGECKO_API_BASE = "https://api.coingecko.com/api/v3";
const ALPH_COINGECKO_ID = "alephium";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// In-memory cache for price data
let cachedPriceData: CachedPriceData | null = null;
let cachedMarketData: CachedMarketData | null = null;

/**
 * Fetches current ALPH price data from CoinGecko
 */
export const getAlephiumPrice = async (): Promise<{
  price: number;
  priceChange24h: number;
  lastUpdated: Date;
}> => {
  // Return cached data if still valid
  const currentTime = Date.now();
  if (cachedPriceData && currentTime < cachedPriceData.expiresAt) {
    console.log("Using cached price data");
    return cachedPriceData.data;
  }
  
  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=${ALPH_COINGECKO_ID}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch price data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as CoinGeckoPriceResponse;
    console.log("Fetched Alephium price data:", data);
    
    const price = data.alephium.usd || 0;
    const priceChange24h = data.alephium.usd_24h_change || 0;
    const lastUpdated = new Date(data.alephium.last_updated_at ? data.alephium.last_updated_at * 1000 : Date.now());
    
    // Cache the data
    cachedPriceData = {
      data: { price, priceChange24h, lastUpdated },
      expiresAt: currentTime + CACHE_DURATION
    };
    
    return { price, priceChange24h, lastUpdated };
  } catch (error) {
    console.error("Error fetching Alephium price:", error);
    // Return last cached data if available, otherwise fall back to defaults
    if (cachedPriceData) {
      return cachedPriceData.data;
    }
    return { price: 0.78, priceChange24h: 0, lastUpdated: new Date() };
  }
};

/**
 * Fetches multiple coins' price data from CoinGecko
 */
export const getMultipleCoinsPrice = async (coinIds: string[]): Promise<{
  id: string;
  name: string;
  symbol: string;
  price: number;
  priceChange24h: number;
  marketCapRank: number;
}[]> => {
  // Return cached data if still valid and contains the same coins
  const currentTime = Date.now();
  if (cachedMarketData && 
      currentTime < cachedMarketData.expiresAt && 
      coinIds.every(id => cachedMarketData!.coinIds.includes(id)) &&
      coinIds.length === cachedMarketData.coinIds.length) {
    console.log("Using cached market data");
    return cachedMarketData.data;
  }
  
  try {
    console.log(`Fetching price data for ${coinIds.length} coins from CoinGecko`);
    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=${coinIds.join(',')}&order=market_cap_desc&per_page=${coinIds.length}&page=1&sparkline=false&price_change_percentage=24h`
    );
    
    if (!response.ok) {
      console.warn(`CoinGecko API returned status ${response.status}: ${response.statusText}`);
      throw new Error(`Failed to fetch market data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as MarketDataResponse[];
    console.log("Fetched market data for coins:", data.map(c => c.id));
    
    const formattedData = data.map(coin => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      price: coin.current_price,
      priceChange24h: coin.price_change_percentage_24h,
      marketCapRank: coin.market_cap_rank || 9999 // Default high rank if not available
    }));
    
    // Cache the data with the list of coin IDs
    cachedMarketData = {
      data: formattedData,
      expiresAt: currentTime + CACHE_DURATION,
      coinIds: coinIds
    };
    
    return formattedData;
  } catch (error) {
    console.error("Error fetching market data:", error);
    
    // Return last cached data if available
    if (cachedMarketData) {
      console.log("Returning cached market data after fetch error");
      return cachedMarketData.data;
    }
    
    // Return mock data as fallback, with focus on Alephium tokens
    console.log("Returning mock market data");
    const mockData = [
      { 
        id: 'bitcoin', 
        name: 'Bitcoin', 
        symbol: 'btc', 
        price: 67000, 
        priceChange24h: 2.5, 
        marketCapRank: 1 
      },
      { 
        id: 'alephium', 
        name: 'Alephium', 
        symbol: 'alph', 
        price: 0.78, 
        priceChange24h: -1.2, 
        marketCapRank: 268 
      },
      { 
        id: 'alphbanx', 
        name: 'AlphBanx', 
        symbol: 'abx', 
        price: 0.05, 
        priceChange24h: 0.5, 
        marketCapRank: 1200 
      },
      { 
        id: 'ergo', 
        name: 'Ergo', 
        symbol: 'erg', 
        price: 1.42, 
        priceChange24h: 0.8, 
        marketCapRank: 302 
      },
      {
        id: 'ethereum',
        name: 'Ethereum',
        symbol: 'eth',
        price: 3500,
        priceChange24h: 1.2,
        marketCapRank: 2
      },
      {
        id: 'cardano',
        name: 'Cardano',
        symbol: 'ada',
        price: 0.45,
        priceChange24h: -0.5,
        marketCapRank: 8
      }
    ];
    
    // Filter mock data to only include requested coins
    return mockData.filter(coin => coinIds.includes(coin.id))
      // For any coin IDs not in our mock data, create a placeholder
      .concat(coinIds.filter(id => !mockData.some(coin => coin.id === id))
        .map(id => ({
          id,
          name: id.charAt(0).toUpperCase() + id.slice(1),
          symbol: id.substring(0, 3),
          price: 1.0,
          priceChange24h: 0,
          marketCapRank: 9999
        }))
      );
  }
};

/**
 * Fetches historical price data for ALPH from CoinGecko
 */
export const getAlephiumPriceHistory = async (days: number = 7): Promise<{ 
  timestamp: number; 
  price: number;
}[]> => {
  try {
    // Use lower resolution for longer time periods to reduce data size
    const resolution = days > 30 ? 'daily' : days > 7 ? '4h' : '1h';
    
    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/${ALPH_COINGECKO_ID}/market_chart?vs_currency=usd&days=${days}&interval=${resolution}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch price history: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as MarketChartResponse;
    
    // Transform data to our preferred format
    return data.prices.map(([timestamp, price]) => ({
      timestamp,
      price
    }));
  } catch (error) {
    console.error("Error fetching Alephium price history:", error);
    return []; // Return empty array on error
  }
};
