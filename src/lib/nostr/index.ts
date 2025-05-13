
import { SimplePool } from 'nostr-tools';
import { NostrEvent, Relay } from './types';
import { EVENT_KINDS, LIST_IDENTIFIERS } from './constants';
import { contentCache } from './cache/content-cache';
import { contentFormatter } from './format/content-formatter';
import { NostrService } from './service';
import { adaptedNostrService as nostrServiceInstance } from './nostr-adapter';
import { formatPubkey, getNpubFromHex, getHexFromNpub } from './utils/keys';

// Re-export types from internal modules
export type { NostrEvent, Relay } from './types';
export type { NostrProfileMetadata } from './types';
export { EVENT_KINDS, LIST_IDENTIFIERS } from './constants';

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
