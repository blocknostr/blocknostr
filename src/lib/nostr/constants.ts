
/**
 * Event kinds as defined in the Nostr protocol and NIPs
 */
export const EVENT_KINDS = {
  META: 0,              // NIP-01: Profile metadata
  TEXT_NOTE: 1,         // NIP-01: Text note
  RECOMMEND_SERVER: 2,  // NIP-01: Recommend server
  CONTACTS: 3,          // NIP-02: Contacts list
  DIRECT_MESSAGE: 4,    // NIP-04: Encrypted direct message
  DELETE: 5,            // NIP-09: Event deletion
  REPOST: 6,            // NIP-18: Repost
  REACTION: 7,          // NIP-25: Reaction
  BADGE_AWARD: 8,       // NIP-58: Badge award
  MUTE_LIST: 10000,     // NIP-51: Mute list
  COMMUNITY: 34550,     // NIP-172: Community definition
  SUBSCRIBE: 31337,     // Subscribe to community
  UNSUBSCRIBE: 31338,   // Unsubscribe from community
  PROPOSAL: 31339,      // Community proposal
  VOTE: 31340,          // Vote on proposal
  CLOSURE: 31341,       // Close proposal
  NOTE_DRAFT: 30023,    // Draft note (not standard)
  RELAY_LIST: 10002     // NIP-65: Relay list metadata
};

/**
 * Default relays
 */
export const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.nostr.band"
];

/**
 * Fallback relay for when user has no relays configured
 */
export const FALLBACK_RELAY = "wss://relay.damus.io";
