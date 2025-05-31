/**
 * Environment utility functions for API endpoints and configuration
 */

export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

/**
 * ✅ API Base URLs - Uses proxy in development, direct calls in production
 */
export const API_ENDPOINTS = {
  // CoinGecko API - resolves CORS issues in development
  COINGECKO: isDevelopment 
    ? "/api/coingecko"  // Development: Use Vite proxy
    : "https://api.coingecko.com/api/v3",  // Production: Direct API call
    
  // IPFS Gateway
  IPFS: isDevelopment 
    ? "/api/ipfs"  // Development: Use Vite proxy
    : "https://ipfs.io",  // Production: Direct IPFS gateway
    
  // Arweave Gateway
  ARWEAVE: isDevelopment 
    ? "/api/arweave"  // Development: Use Vite proxy
    : "https://arweave.net",  // Production: Direct Arweave gateway
} as const;

/**
 * ✅ Helper function to get API base URL with environment-specific logging
 */
export const getApiBaseUrl = (service: keyof typeof API_ENDPOINTS): string => {
  const baseUrl = API_ENDPOINTS[service];
  
  if (isDevelopment) {
    console.log(`[Environment] Using ${service} API via proxy: ${baseUrl}`);
  }
  
  return baseUrl;
};

/**
 * ✅ Environment feature flags
 */
export const FEATURES = {
  DEBUG_MODE: isDevelopment || import.meta.env.VITE_DEBUG === 'true',
  PERFORMANCE_LOGGING: isDevelopment || import.meta.env.VITE_PERF_LOG === 'true',
  MOCK_DATA: import.meta.env.VITE_MOCK_DATA === 'true',
} as const; 