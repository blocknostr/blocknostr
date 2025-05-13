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
  BookmarkAdapterInterface,
  BaseAdapterInterface
} from './types/adapter';

// Re-export from social module
export { SocialManager } from './social';
export type { ReactionCounts, ContactList, QuickReply } from './social/types';

// Re-export from community module
export type { ProposalCategory } from '@/types/community';

// Export bookmark types for backward compatibility
export type { BookmarkCollection, BookmarkWithMetadata } from './bookmark';

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
