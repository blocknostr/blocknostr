// Event kinds based on NIPs
export const EVENT_KINDS = {
  METADATA: 0,           // User metadata (NIP-01)
  TEXT_NOTE: 1,          // Short text note (NIP-01)
  RECOMMEND_RELAY: 2,    // Recommend relay (NIP-01)
  CONTACT_LIST: 3,       // Contact list (NIP-02)
  DM: 4,                 // Direct/private message (NIP-04)
  ENCRYPTED_DM: 4,       // Encrypted direct message (NIP-04) - alias for DM
  DELETE: 5,             // Deletion (NIP-09)
  REPOST: 6,             // Repost/quote (NIP-18)
  REACTION: 7,           // Reaction (NIP-25)
  BADGE_AWARD: 8,        // Badge award (NIP-58)
  PUBLIC_CHAT_MESSAGE: 9, // Public chat message (Custom)
  POLL: 6001,            // Poll (Custom)
  ARTICLE: 30023,        // Long-form content (NIP-23)
  PROFILE_BADGES: 30008, // Profile badges (NIP-58)
  COMMUNITY_DEFINITION: 34550, // Community definition (NIP-72)
  COMMUNITY_POST: 1,     // Community post (same as text note)
};

// Zap related event kinds
export const ZAP_KINDS = {
  ZAP_REQUEST: 9734,
  ZAP_RECEIPT: 9735
};

// ✅ Known free relays that don't require payment
export const FREE_RELAYS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.snort.social",
  "wss://relay.nostr.band",
  "wss://offchain.pub",
  "wss://nostr.wine",
  "wss://relay.primal.net",
  "wss://purplepag.es",
  "wss://relay.nostrich.de",
  "wss://nostr.mom"
];

// ✅ Known paid/restricted relays (for reference)
export const PAID_RELAYS = [
  "wss://relay.nostr.com.au", // Example - may require payment
  "wss://relay.nostr.info"    // Example - may require payment  
];

// ✅ Relay categories for better management
export const RELAY_CATEGORIES = {
  FREE: 'free',
  PAID: 'paid',
  UNKNOWN: 'unknown'
} as const;

export type RelayCategory = typeof RELAY_CATEGORIES[keyof typeof RELAY_CATEGORIES];

// ✅ Function to classify relay type
export function getRelayCategory(relayUrl: string): RelayCategory {
  if (FREE_RELAYS.includes(relayUrl)) {
    return RELAY_CATEGORIES.FREE;
  }
  if (PAID_RELAYS.includes(relayUrl)) {
    return RELAY_CATEGORIES.PAID;
  }
  return RELAY_CATEGORIES.UNKNOWN;
}

// ✅ FIXED: Improved relay list with reliable FREE relays first, paid relays optional
export const DEFAULT_RELAYS = [
  // Tier 1: Most reliable FREE public relays (prioritized)
  'wss://relay.damus.io',       // Most reliable overall, completely free
  'wss://nos.lol',              // High availability and fast, free
  'wss://relay.nostr.band',     // Excellent uptime and comprehensive, free
  'wss://offchain.pub',         // Fast European relay, free
  'wss://nostr.wine',           // European relay, good performance, free
  
  // Tier 2: Additional reliable free relays
  'wss://relay.primal.net',     // Reliable alternative, free
  
  // Tier 3: BlockNostr relay (added per user request)
  'wss://relay.blocknostr.com', // BlockNostr relay
];

// ✅ NEW: Connection retry configuration
export const CONNECTION_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_RETRY_DELAY: 1000,    // 1 second
  MAX_RETRY_DELAY: 30000,       // 30 seconds
  BACKOFF_MULTIPLIER: 2,        // Exponential backoff
  CONNECTION_TIMEOUT: 8000,     // 8 seconds per connection attempt
  CIRCUIT_BREAKER_FAILURES: 5, // Circuit breaker threshold
  CIRCUIT_BREAKER_TIMEOUT: 300000, // 5 minutes before retry
  MIN_SUCCESSFUL_RELAYS: 2,     // Minimum relays needed for operation
};

// Time constants
export const TIME_CONSTANTS = {
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000
};

// Rate limiting
export const RATE_LIMITS = {
  FOLLOW_REQUESTS_PER_MINUTE: 5,
  POSTS_PER_MINUTE: 10,
  REACTIONS_PER_MINUTE: 30
};

