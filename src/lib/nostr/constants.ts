
// Define all standard Nostr event kinds used in the application
export const EVENT_KINDS = {
  META: 0,               // Metadata - NIP-01
  TEXT_NOTE: 1,          // Short text note - NIP-01
  RECOMMEND_RELAY: 2,    // Recommend relay - NIP-01
  CONTACTS: 3,           // Contact list - NIP-02
  ENCRYPTED_DM: 4,       // Encrypted direct message - NIP-04 (deprecated, use 14)
  DELETE: 5,             // Delete - NIP-09
  REPOST: 6,             // Repost - NIP-18
  REACTION: 7,           // Reaction - NIP-25
  BADGE_AWARD: 8,        // Badge award - NIP-58
  ENCRYPTED_DM_V2: 14,   // Encrypted direct message - NIP-17 (replaces kind:4)
  RELAY_LIST: 10002,     // Relay list metadata - NIP-65
  COMMUNITY: 34550,      // Communities - NIP-172
  BOOKMARK_LIST: 10003,  // Bookmarks - NIP-51 (was missing)
  BOOKMARKS: 10003,      // Alias for BOOKMARK_LIST
  BOOKMARK_COLLECTIONS: 30001, // Custom kind for bookmark collections
  BOOKMARK_METADATA: 30002,    // Custom kind for bookmark metadata (tags, notes)
  MUTE_LIST: 10000,      // NIP-51 Mute List
  BLOCK_LIST: 16462,     // Custom kind for Block List (following NIP-51 pattern)
  PROPOSAL: 34551,       // Custom kind for proposals
  VOTE: 34552,           // Custom kind for votes
  COMMENT: 34553,        // Custom kind for comments
  KICK_PROPOSAL: 34554,  // Custom kind for kick proposals
  KICK_VOTE: 34555,      // Custom kind for kick votes
  COMMUNITY_METADATA: 34556, // New: Community guidelines, rules, etc
  COMMUNITY_INVITE: 34557,   // New: Community invite links
  COMMUNITY_ROLE: 34558,     // New: Role assignments within communities
  COMMUNITY_ACTIVITY: 34559, // New: Member activity tracking
  BADGES: 30009,         // Badge definition - NIP-58
  ZAP_REQUEST: 9734,     // Zap Request - NIP-57
  ZAP_RECEIPT: 9735      // Zap Receipt - NIP-57
};
