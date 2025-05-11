
import { SimplePool } from 'nostr-tools';
import { NostrEvent, Relay } from './types';
import { EVENT_KINDS } from './constants';
import { NostrService } from './service';
import { CommunityService } from './services/community-service';
import { ProfileService } from './services/profile-service';
import { BookmarkService } from './services/bookmark-service';

// Initialize the NostrService instance
const nostrService = new NostrService();

// Add service extensions
const communityService = new CommunityService(
  nostrService.communityManager,
  () => nostrService.getRelayStatus().filter(relay => relay.status === 'connected').map(relay => relay.url),
  new SimplePool(),
  nostrService.publicKey
);

const profileService = new ProfileService(
  new SimplePool(),
  () => nostrService.getRelayStatus().filter(relay => relay.status === 'connected').map(relay => relay.url)
);

const bookmarkService = new BookmarkService(
  nostrService.bookmarkManager,
  new SimplePool(),
  nostrService.publicKey,
  () => nostrService.getRelayStatus().filter(relay => relay.status === 'connected').map(relay => relay.url)
);

// Extend the nostrService with the new services
Object.defineProperties(nostrService, {
  getUserProfile: {
    value: async (pubkey: string) => {
      return profileService.getUserProfile(pubkey);
    }
  },
  verifyNip05: {
    value: async (identifier: string, expectedPubkey: string) => {
      return profileService.verifyNip05(identifier, expectedPubkey);
    }
  },
  fetchNip05Data: {
    value: async (identifier: string) => {
      return profileService.fetchNip05Data(identifier);
    }
  },
  fetchCommunity: {
    value: async (communityId: string) => {
      return communityService.fetchCommunity(communityId);
    }
  }
});

export { nostrService };

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
