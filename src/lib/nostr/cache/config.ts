
/**
 * Cache configuration settings
 * Optimized for reduced memory footprint and critical data priority
 */

// Cache expiration time in milliseconds (reduced from 10 to 5 minutes)
export const CACHE_EXPIRY = 5 * 60 * 1000;

// Cache expiration time for offline mode (reduced from 1 week to 3 days)
export const OFFLINE_CACHE_EXPIRY = 3 * 24 * 60 * 60 * 1000;

// Max items per cache type to prevent excessive memory usage
export const CACHE_SIZE_LIMITS = {
  EVENTS: 500,      // Max number of events to keep in cache
  PROFILES: 200,    // Max number of profiles to keep in cache
  FEEDS: 10,        // Max number of feeds to keep in cache
  THREADS: 50       // Max number of threads to keep in cache
};

// Critical data TTL (longer expiration for important data)
export const CRITICAL_DATA_TTL = 30 * 60 * 1000; // 30 minutes

// Storage keys for different cache types
export const STORAGE_KEYS = {
  EVENTS: 'nostr_cached_events',
  PROFILES: 'nostr_cached_profiles',
  FEEDS: 'nostr_cached_feeds',
  THREADS: 'nostr_cached_threads',
  MUTE_LIST: 'nostr_mute_list',
  BLOCK_LIST: 'nostr_block_list'
};

// Cleanup intervals
export const CLEANUP_INTERVAL = 2 * 60 * 1000; // 2 minutes
export const QUOTA_CHECK_INTERVAL = 60 * 1000; // 1 minute

// Storage quota thresholds (percentage of available storage)
export const QUOTA_WARNING_THRESHOLD = 70; // 70%
export const QUOTA_DANGER_THRESHOLD = 85;  // 85%
