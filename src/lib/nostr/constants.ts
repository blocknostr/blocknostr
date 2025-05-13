
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
  
  // Community-specific events (custom)
  COMMUNITY: 34550, // Community definition event
  PROPOSAL: 34551, // Community proposal event
  VOTE: 34552, // Vote on a community proposal
  BLOCK_LIST: 10000, // User block list
  MUTE_LIST: 10001, // User mute list
  
  // Specialized events (NIP-22, NIP-40)
  CHANNEL_CREATION: 40, // Channel creation
  CHANNEL_METADATA: 41, // Channel metadata
  CHANNEL_MESSAGE: 42, // Channel message
  
  LONG_FORM: 30023, // Long-form content (NIP-23)
  
  ZAP_REQUEST: 9734, // Zap request (NIP-57)
  ZAP_RECEIPT: 9735, // Zap receipt (NIP-57)
}
