import { SimplePool } from 'nostr-tools';
import { NostrEvent, Relay } from './types';
import { EVENT_KINDS } from './constants';
import { contentCache } from './cache/content-cache';
import { contentFormatter } from './format/content-formatter';
import { NostrService } from './service';
import { adaptedNostrService as nostrServiceInstance } from './nostr-adapter';
import { formatPubkey, getNpubFromHex, getHexFromNpub } from './utils/keys';

// Re-export types from internal modules
export type { NostrEvent, Relay } from './types';
export type { NostrProfileMetadata } from './types';
export { EVENT_KINDS } from './constants';

// Export adapter interfaces
export type {
  NostrAdapterInterface,
  SocialAdapterInterface,
  RelayAdapterInterface,
  DataAdapterInterface,
  CommunityAdapterInterface,
  BaseAdapterInterface
} from './types/adapter';

// Re-export from social module
export { SocialManager } from './social';
export type { ReactionCounts, ContactList } from './social/types';

// Re-export from community module
export type { ProposalCategory } from '@/types/community';

// Export key utility functions
export { formatPubkey, getNpubFromHex, getHexFromNpub };

// Export service instance and type
export { nostrServiceInstance as nostrService };
export type { NostrService };

// Export cache modules
export { contentCache };

// Export formatter
export { contentFormatter };

// Export NIP utilities
export * from './utils/nip';

// Export main services/components
export { nostrService } from './service';
export { communityService } from './services/community-service';
export { profileService } from './services/profile-service';
export { threadService } from './services/thread';
export { messageService } from './social/messages';
export { contactsService } from './social/contacts';
export { reactionsService } from './social/interactions/reactions';
export { feedService } from './feed';

// Export constants
export { 
  DEFAULT_RELAYS, 
  EventKinds, 
  EVENT_KINDS, // Include EVENT_KINDS as an alias for EventKinds
  DAO_KINDS, 
  ContentTypes, 
  MAIN_FEED_SUB_ID, 
  FOLLOWING_FEED_SUB_ID, 
  USER_PROFILE_SUB_ID, 
  USER_POSTS_SUB_ID, 
  TRENDING_TOPICS_SUB_ID, 
  NOTIFICATIONS_SUB_ID, 
  ARTICLE_FEED_SUB_ID, 
  NOTE_THREAD_SUB_ID 
} from './constants';

// Export types
export type { NostrEvent, NostrSubscription, NostrFilter } from './types';
