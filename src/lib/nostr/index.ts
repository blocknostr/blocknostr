
import { SimplePool } from 'nostr-tools';
import { NostrEvent, Relay } from './types';
import { EVENT_KINDS } from './constants';
import { NostrService } from './service';
import { formatPubkey, getNpubFromHex, getHexFromNpub } from './utils/keys';

// Initialize the NostrService instance
const nostrService = new NostrService();

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
export type { BookmarkCollection, BookmarkWithMetadata } from './bookmark';

// Re-export from services
export { ProfileService, CommunityService, BookmarkService } from './services';
export type { BaseServiceConfig, SubscriptionResult, EventSubscription } from './services/types';

// Export key utility functions
export { formatPubkey, getNpubFromHex, getHexFromNpub };

// Export service instance
export { nostrService };
