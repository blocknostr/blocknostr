import { SavedWallet } from '@/api/types/wallet';

// Rate limiting configuration
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  backoffMs: number;
  maxBackoffMs: number;
}

// Relaxed rate limits (more reasonable for multiple wallets)
const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  balance: { maxRequests: 20, windowMs: 60000, backoffMs: 500, maxBackoffMs: 10000 },
  utxos: { maxRequests: 15, windowMs: 60000, backoffMs: 500, maxBackoffMs: 15000 },
  transactions: { maxRequests: 10, windowMs: 60000, backoffMs: 1000, maxBackoffMs: 20000 },
  tokens: { maxRequests: 15, windowMs: 60000, backoffMs: 500, maxBackoffMs: 15000 },
};

// Request tracking
interface RequestTracker {
  requests: number[];
  lastRequest: number;
  backoffUntil: number;
  failures: number;
}

// Global rate limit state
const rateLimitState: Record<string, RequestTracker> = {};

// Cache for API responses with TTL
interface CachedResponse<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const apiCache = new Map<string, CachedResponse<any>>();

// Request deduplication
const pendingRequests = new Map<string, Promise<any>>();

// Add this new variable at the top level
let rateLimitingEnabled = true;

// Add this new function to temporarily disable rate limiting
export function disableRateLimiting(disabled: boolean = true) {
  rateLimitingEnabled = !disabled;
  console.log(`[RateLimit] Rate limiting ${rateLimitingEnabled ? 'enabled' : 'disabled'}`);
}

/**
 * Check if we can make a request based on rate limits
 */
function canMakeRequest(endpoint: string): boolean {
  // Allow all requests if rate limiting is disabled
  if (!rateLimitingEnabled) return true;
  
  const config = DEFAULT_RATE_LIMITS[endpoint];
  if (!config) return true;

  const tracker = rateLimitState[endpoint] || {
    requests: [],
    lastRequest: 0,
    backoffUntil: 0,
    failures: 0
  };

  const now = Date.now();

  // Check if we're in backoff period
  if (now < tracker.backoffUntil) {
    return false;
  }

  // Clean old requests outside the window
  tracker.requests = tracker.requests.filter(time => now - time < config.windowMs);

  // Check if we're under the rate limit
  return tracker.requests.length < config.maxRequests;
}

/**
 * Record a request and update rate limiting state
 */
function recordRequest(endpoint: string, success: boolean): void {
  const config = DEFAULT_RATE_LIMITS[endpoint];
  if (!config) return;

  let tracker = rateLimitState[endpoint];
  if (!tracker) {
    tracker = rateLimitState[endpoint] = {
      requests: [],
      lastRequest: 0,
      backoffUntil: 0,
      failures: 0
    };
  }

  const now = Date.now();
  tracker.lastRequest = now;

  if (success) {
    tracker.requests.push(now);
    tracker.failures = 0;
  } else {
    tracker.failures++;
    // Exponential backoff on failures
    const backoffTime = Math.min(
      config.backoffMs * Math.pow(2, tracker.failures - 1),
      config.maxBackoffMs
    );
    tracker.backoffUntil = now + backoffTime;
    console.warn(`[RateLimit] ${endpoint} failed, backing off for ${backoffTime}ms`);
  }
}

/**
 * Get cached response if available and not stale
 */
function getCachedResponse<T>(key: string): T | null {
  const cached = apiCache.get(key);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > cached.ttl) {
    apiCache.delete(key);
    return null;
  }

  return cached.data;
}

/**
 * Cache a response with TTL
 */
function setCachedResponse<T>(key: string, data: T, ttl: number): void {
  apiCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
}

/**
 * Rate-limited wrapper for API functions
 */
export async function rateLimitedApiCall<T>(
  endpoint: string,
  apiFunction: () => Promise<T>,
  cacheKey: string,
  cacheTtl: number = 15 * 60 * 1000 // 15 minutes default
): Promise<T> {
  // Check cache first
  const cached = getCachedResponse<T>(cacheKey);
  if (cached !== null) {
    console.log(`[Cache] Hit for ${cacheKey}`);
    return cached;
  }

  // Check for pending duplicate request
  if (pendingRequests.has(cacheKey)) {
    console.log(`[Dedup] Waiting for pending request ${cacheKey}`);
    return pendingRequests.get(cacheKey);
  }

  // Check rate limits
  if (!canMakeRequest(endpoint)) {
    const tracker = rateLimitState[endpoint];
    const waitTime = tracker ? tracker.backoffUntil - Date.now() : 0;
    
    if (waitTime > 0) {
      console.warn(`[RateLimit] ${endpoint} rate limited, waiting ${waitTime}ms`);
      
      // Return cached data even if stale, rather than failing
      const staleCache = apiCache.get(cacheKey);
      if (staleCache) {
        console.log(`[Cache] Returning stale data for ${cacheKey}`);
        return staleCache.data;
      }
      
      throw new Error(`Rate limited: ${endpoint}. Wait ${Math.ceil(waitTime / 1000)}s`);
    }
  }

  // Make the request
  const requestPromise = (async () => {
    try {
      console.log(`[API] Making request to ${endpoint} for ${cacheKey}`);
      const result = await apiFunction();
      
      // Record success and cache result
      recordRequest(endpoint, true);
      setCachedResponse(cacheKey, result, cacheTtl);
      
      return result;
    } catch (error: any) {
      recordRequest(endpoint, false);
      
      // If it's a rate limit error, try to return stale cache
      if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
        const staleCache = apiCache.get(cacheKey);
        if (staleCache) {
          console.log(`[Cache] Returning stale data due to 429 for ${cacheKey}`);
          return staleCache.data;
        }
      }
      
      throw error;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  })();

  // Store pending request for deduplication
  pendingRequests.set(cacheKey, requestPromise);
  
  return requestPromise;
}

/**
 * Get rate limit status for monitoring
 */
export function getRateLimitStatus() {
  const status: Record<string, any> = {};
  
  for (const [endpoint, tracker] of Object.entries(rateLimitState)) {
    const config = DEFAULT_RATE_LIMITS[endpoint];
    const now = Date.now();
    
    status[endpoint] = {
      requestsInWindow: tracker.requests.filter(time => now - time < config.windowMs).length,
      maxRequests: config.maxRequests,
      backoffUntil: tracker.backoffUntil,
      failures: tracker.failures,
      canMakeRequest: canMakeRequest(endpoint)
    };
  }
  
  return {
    endpoints: status,
    cacheSize: apiCache.size,
    pendingRequests: pendingRequests.size
  };
}

/**
 * Clear rate limit state (for testing or reset)
 */
export function clearRateLimitState() {
  Object.keys(rateLimitState).forEach(key => delete rateLimitState[key]);
  apiCache.clear();
  pendingRequests.clear();
}

/**
 * Smart wallet refresh that respects both cache TTL and rate limits
 */
export function shouldRefreshWallet(wallet: SavedWallet): boolean {
  if (!wallet.cacheMetadata) return true;
  
  const now = Date.now();
  const isExpired = now > wallet.cacheMetadata.expiresAt;
  const isStale = wallet.cacheMetadata.isStale;
  
  // Don't refresh if we recently failed multiple times
  if (wallet.cacheMetadata.retryCount >= wallet.cacheMetadata.maxRetries) {
    const timeSinceLastTry = now - wallet.cacheMetadata.lastRefresh;
    const cooldownPeriod = 5 * 60 * 1000; // 5 minutes
    if (timeSinceLastTry < cooldownPeriod) {
      return false;
    }
  }
  
  return isExpired || isStale;
}

/**
 * Debug function to log current rate limit status
 */
export function debugRateLimits() {
  const status = getRateLimitStatus();
  console.log('🔍 [RateLimit Debug] Current Status:', {
    enabled: rateLimitingEnabled,
    cacheSize: status.cacheSize,
    pendingRequests: status.pendingRequests,
    endpoints: status.endpoints
  });
  
  // Log specific endpoint status
  for (const [endpoint, data] of Object.entries(status.endpoints)) {
    const canRequest = canMakeRequest(endpoint);
    console.log(`📊 [RateLimit] ${endpoint}: ${data.requestsInWindow}/${data.maxRequests} requests, can request: ${canRequest}`);
    
    if (data.backoffUntil > Date.now()) {
      const waitTime = Math.ceil((data.backoffUntil - Date.now()) / 1000);
      console.log(`⏰ [RateLimit] ${endpoint}: backing off for ${waitTime}s`);
    }
  }
}

// Make debug functions available globally for console access
if (typeof window !== 'undefined') {
  (window as any).debugRateLimits = debugRateLimits;
  (window as any).disableRateLimiting = disableRateLimiting;
  (window as any).clearRateLimitState = clearRateLimitState;
} 

