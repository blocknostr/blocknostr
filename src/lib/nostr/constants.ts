
// Event types based on Nostr Kinds
export const EVENT_KINDS = {
  META: 0,            // Profile metadata
  TEXT_NOTE: 1,       // Standard note/post
  RECOMMEND_RELAY: 2, // Relay recommendations
  CONTACTS: 3,        // Following list
  DIRECT_MESSAGE: 4,  // Encrypted direct messages (legacy)
  REACTION: 7,        // Reactions to notes
  ENCRYPTED_DM: 14,   // NIP-17 Encrypted Direct Messages
  RELAY_LIST: 10050,  // Relay lists
  COMMUNITY: 34550,   // Communities/DAOs
  PROPOSAL: 34551,    // Proposals within communities
  VOTE: 34552,        // Votes on proposals
  COMMENT: 34553,     // Comments on proposals
  KICK_PROPOSAL: 34554, // Proposal to kick a member
  KICK_VOTE: 34555,   // Vote on kick proposal
  
  // NIP-51 Lists
  BOOKMARK_LIST: 30001,  // Bookmarks list
  MUTE_LIST: 10000,      // Muted users/posts
  PIN_LIST: 10001,       // Pinned notes
  CURATED_LIST: 30000,   // Generic lists
};
