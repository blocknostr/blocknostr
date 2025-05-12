
/**
 * Standard Nostr event kinds according to NIPs
 */
export enum EVENT_KINDS {
  META = 0,              // NIP-01: Profile metadata
  TEXT_NOTE = 1,         // NIP-01: Short text note
  RECOMMENDED_SERVER = 2, // NIP-01: Recommended relay
  CONTACTS = 3,          // NIP-02: Contact list
  DM = 4,                // NIP-04: Encrypted direct message (deprecated)
  DELETE = 5,            // NIP-09: Event deletion
  REACTION = 7,          // NIP-25: Reaction
  
  // Extended kinds
  BOOKMARK = 30001,      // Bookmark
  BOOKMARK_COLLECTIONS = 30003, // Bookmark collections
  BOOKMARK_METADATA = 30004,    // Bookmark metadata
  COMMUNITY = 34550,     // Community creation
  PROPOSAL = 34551,      // Community proposal
  VOTE = 34552,          // Vote on proposal
  BADGE = 30008,         // Badge definition
  
  // Custom kinds for our application
  PROFILE_LIST = 30000,  // Lists of profiles (following, muted, etc.)
  COMMUNITY_CONFIG = 30017, // Community configuration
  COMMUNITY_INVITE = 30018, // Community invitation
  COMMUNITY_ROLE = 30019,  // Community role assignment
  
  // User lists
  MUTE_LIST = 10000,     // NIP-51: Mute list
  BLOCK_LIST = 10000,    // NIP-51: Block list (same kind as MUTE_LIST, different 'd' tag)
  
  // Direct messaging and reposts
  ENCRYPTED_DM = 4,      // Same as DM for backward compatibility
  REPOST = 6,            // NIP-18: Repost
}

/**
 * Standard tag names used in Nostr
 */
export const TAG_NAMES = {
  EVENT: 'e',
  PUBKEY: 'p',
  TAG: 't',
  REFERENCE: 'r',
  HASHTAG: 't',
  MENTION: 'p',
  DELEGATION: 'delegation',
  EXPIRATION: 'expiration',
  SUBJECT: 'subject',
  NONCE: 'nonce',
};

/**
 * Default relays to connect to if user has none configured
 */
export const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nos.lol',
  'wss://nostr.wine',
  'wss://relay.nostr.info'
];
