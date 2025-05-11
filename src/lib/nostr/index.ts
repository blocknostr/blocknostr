
import { SimplePool } from 'nostr-tools';
import { NostrEvent, Relay } from './types';
import { EVENT_KINDS } from './constants';
import { contentCache } from './cache/content-cache';
import { contentFormatter } from './format/content-formatter';
import { NostrService } from './services';
import { nostrService } from './services/index';
import { formatPubkey, getNpubFromHex, getHexFromNpub } from './utils/keys';
import { BookmarkService } from './services/bookmark-service';

// Re-export types from internal modules
export type { NostrEvent, Relay } from './types';
export type { NostrProfileMetadata } from './types';
export { EVENT_KINDS } from './constants';

// Re-export from social module
export { SocialManager } from './social';
export type { ReactionCounts, ContactList } from './social/types';

// Re-export from community module
export type { ProposalCategory } from '@/types/community';

// Re-export from bookmark module
export type { 
  BookmarkCollection, 
  BookmarkWithMetadata, 
  BookmarkStatus,
  BookmarkFilters,
  BookmarkOperationType
} from './bookmark/types';

// Export key utility functions
export { formatPubkey, getNpubFromHex, getHexFromNpub };

// Export service instance
export { nostrService };
export type { NostrService };

// Export cache modules
export { contentCache };

// Export formatter
export { contentFormatter };

// Export service-related types
export type { BookmarkService };
