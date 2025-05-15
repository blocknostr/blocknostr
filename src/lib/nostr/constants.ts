
/**
 * Nostr event kinds
 * See NIP-01 for more details
 */
export const EVENT_KINDS = {
  METADATA: 0,
  TEXT_NOTE: 1,
  RECOMMENDED_RELAY: 2,
  CONTACTS: 3,
  ENCRYPTED_DIRECT_MESSAGE: 4,
  EVENT_DELETION: 5,
  REPOST: 6,
  REACTION: 7,
  BADGE_AWARD: 8,
  
  // NIP-28 Channel management
  CHANNEL_CREATION: 40,
  CHANNEL_METADATA: 41,
  CHANNEL_MESSAGE: 42,
  CHANNEL_HIDE_MESSAGE: 43,
  CHANNEL_MUTE_USER: 44,
  
  // Custom event kinds for our app
  COMMUNITY: 34550,
  PROPOSAL: 34551,
  VOTE: 34552,
  COMMENT: 34553,
  KICK_PROPOSAL: 34554,
  KICK_VOTE: 34555,
  COMMUNITY_METADATA: 34556,
  COMMUNITY_INVITE: 34557,
  COMMUNITY_ROLE: 34558,
  COMMUNITY_ACTIVITY: 34559,
  
  // NIP-65 Relay List Metadata
  RELAY_LIST_METADATA: 10002
};

/**
 * Default relays to connect to
 */
export const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://nostr.bitcoiner.social",
  "wss://relay.nostr.band",
  "wss://relay.snort.social"
];

/**
 * Nostr profile fields
 */
export const PROFILE_FIELDS = {
  NAME: "name",
  DISPLAY_NAME: "display_name",
  PICTURE: "picture",
  ABOUT: "about",
  WEBSITE: "website",
  NIP05: "nip05"
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  NOT_LOGGED_IN: "You must be logged in to perform this action",
  NO_CONNECTED_RELAYS: "No connected relays available",
  FAILED_TO_PUBLISH: "Failed to publish event",
  FAILED_TO_FETCH: "Failed to fetch data",
  INVALID_PUBKEY: "Invalid public key",
  INVALID_EVENT: "Invalid event",
  TIMEOUT: "Operation timed out"
};

/**
 * Timeout values (in milliseconds)
 */
export const TIMEOUTS = {
  RELAY_CONNECT: 5000,
  EVENT_PUBLISH: 10000,
  EVENT_SUBSCRIPTION: 10000,
  PROFILE_FETCH: 10000
};
