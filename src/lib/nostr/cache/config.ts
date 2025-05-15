
/**
 * Cache configuration settings
 */

// Cache expiration time in milliseconds (10 minutes)
export const CACHE_EXPIRY = 10 * 60 * 1000;

// Cache expiration time for offline mode (1 week)
export const OFFLINE_CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000;

// Storage keys for different cache types
export const STORAGE_KEYS = {
  EVENTS: 'nostr_cached_events',
  PROFILES: 'nostr_cached_profiles',
  FEEDS: 'nostr_cached_feeds',
  MUTE_LIST: 'nostr_mute_list',
  BLOCK_LIST: 'nostr_block_list'
};
