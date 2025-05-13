
export const EVENT_KINDS = {
  META: 0, // Profile metadata (NIP-01)
  METADATA: 0, // Alias for META for compatibility
  TEXT_NOTE: 1, // Text note (NIP-01)
  RECOMMEND_RELAY: 2, // Recommend relay (NIP-01)
  CONTACTS: 3, // Contacts/Following list (NIP-02)
  ENCRYPTED_DM: 4, // Encrypted direct message (NIP-04)
  DELETE: 5, // Delete event (NIP-09)
  REPOST: 6, // Repost event (NIP-18)
  REACTION: 7, // Reaction event (NIP-25)
  BADGE_AWARD: 8, // Badge award (NIP-58)
  ENCRYPTED_DM_V2: 14, // Encrypted direct message v2 (NIP-44)
  
  // Parameterized replaceable events (NIP-33)
  EVENT_APP: 30000, // Generic application-specific event
  BOOKMARKS: 30001, // Bookmarks list (per NIP-51)
  COMMUNITIES: 30002, // User communities
  BOOKMARK_COLLECTIONS: 30003, // Collections of bookmarks (custom)
  BOOKMARK_METADATA: 30004, // Metadata for bookmarks (custom)
  
  // Community-specific events (NIP-72)
  COMMUNITY_DEFINITION: 34550, // Community definition (NIP-72)
  COMMUNITY_METADATA: 30009, // Community metadata as parameterized replaceable event (NIP-72)
  COMMUNITY_POST: 1310, // Post to a community (NIP-72)
  COMMUNITY_APPROVAL: 1311, // Community approval event (NIP-72)
  COMMUNITY_DELETION: 9, // Deletion of a community post (NIP-09 + NIP-72)
  COMMUNITY_MODERATION: 4550, // Community moderation event (NIP-72)
  
  // Specialized events (NIP-22, NIP-40)
  CHANNEL_CREATION: 40, // Channel creation
  CHANNEL_METADATA: 41, // Channel metadata
  CHANNEL_MESSAGE: 42, // Channel message
  
  LONG_FORM: 30023, // Long-form content (NIP-23)
  
  ZAP_REQUEST: 9734, // Zap request (NIP-57)
  ZAP_RECEIPT: 9735, // Zap receipt (NIP-57)
  
  // For backward compatibility - using our custom events with proper mapping
  PROPOSAL: 30301, // Community proposal event (custom mapped to NIP compatible kind)
  VOTE: 7 // Using standard reaction kind for votes (NIP-25)
}

// Add NIP-72 specific constants
export const NIP72 = {
  VERSION: "1.0.0", // Current supported version of NIP-72
  D_TAG_PREFIX: "34550:", // Prefix for community d-tag identifiers
  KIND_METADATA: 30009, // Community metadata (replaceable)
  KIND_POST: 1310, // Post to a community
  KIND_APPROVAL: 1311, // Approval of a post
  PARAM_SEPARATOR: ":",
  ACTION_TYPES: {
    CREATE: "create",
    UPDATE: "update",
    DELETE: "delete",
    MODERATE: "moderate"
  }
};
