
// Default relays
export const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://nostr.bitcoiner.social',
  'wss://relay.nostr.band'
];

// NIP-01 Event Kinds
export const EventKinds = {
  METADATA: 0,
  TEXT: 1,
  TEXT_NOTE: 1, // Alias for TEXT for compatibility
  RECOMMEND_RELAY: 2,
  CONTACTS: 3,
  ENCRYPTED_DIRECT_MESSAGE: 4,
  ENCRYPTED_DM: 4, // Alias for ENCRYPTED_DIRECT_MESSAGE for compatibility
  EVENT_DELETION: 5,
  DELETE: 5, // Alias for EVENT_DELETION for compatibility
  REACTION: 7,
  BADGE_AWARD: 8,
  CHANNEL_CREATE: 40,
  CHANNEL_METADATA: 41,
  CHANNEL_MESSAGE: 42,
  CHANNEL_HIDE_MESSAGE: 43,
  CHANNEL_MUTE_USER: 44,
  REPORTING: 1984,
  ZAP_REQUEST: 9734,
  ZAP_RECEIPT: 9735,
  REPOST: 6,
  BADGE_DEFINITION: 30009,
  LONG_FORM_CONTENT: 30023,
  COMMUNITY: 34550, // Community definition (NIP-72)
  COMMUNITY_DEFINITION: 34550, // Alias for COMMUNITY
  ARTICLE: 30023,
  
  // Bookmark related kinds (for backward compatibility)
  BOOKMARK_COLLECTIONS: 30001,
  BOOKMARK_METADATA: 30003
};

// Export EVENT_KINDS as an alias for EventKinds for backward compatibility
export const EVENT_KINDS = EventKinds;

// DAO/Community Event Kinds (NIP-72)
export const DAO_KINDS = {
  COMMUNITY: 34550,       // Community definition
  PROPOSAL: 34551,        // Proposal
  VOTE: 34552,            // Vote
  INVITE: 34553,          // Invite
  DISCUSSION: 34554       // Community discussion
};

// Content types
export const ContentTypes = {
  TEXT: 'text',
  ARTICLE: 'article',
  POLL: 'poll',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio'
};

// Subscription IDs
export const MAIN_FEED_SUB_ID = 'main-feed';
export const FOLLOWING_FEED_SUB_ID = 'following-feed';
export const USER_PROFILE_SUB_ID = 'user-profile';
export const USER_POSTS_SUB_ID = 'user-posts';
export const TRENDING_TOPICS_SUB_ID = 'trending-topics';
export const NOTIFICATIONS_SUB_ID = 'notifications';
export const ARTICLE_FEED_SUB_ID = 'article-feed';
export const NOTE_THREAD_SUB_ID = 'note-thread';
