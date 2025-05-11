
import { SimplePool } from 'nostr-tools';
import { NostrEvent, Relay } from './types';
import { EVENT_KINDS } from './constants';
import { NostrService } from './service';
import { CommunityService } from './services/community-service';
import { ProfileService } from './services/profile-service';
import { BookmarkService } from './services/bookmark-service';
import { formatPubkey, getNpubFromHex, getHexFromNpub } from './utils/keys';

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

// Extend the nostrService with key utility methods
Object.defineProperties(nostrService, {
  // Profile utility methods
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
  
  // Pubkey formatting utilities
  formatPubkey: {
    value: (pubkey: string) => formatPubkey(pubkey)
  },
  getNpubFromHex: {
    value: (hexPubkey: string) => getNpubFromHex(hexPubkey)
  },
  getHexFromNpub: {
    value: (npub: string) => getHexFromNpub(npub)
  },
  
  // Community methods
  fetchCommunity: {
    value: async (communityId: string) => {
      return communityService.fetchCommunity(communityId);
    }
  },
  createCommunity: {
    value: async (name: string, description: string) => {
      const connectedRelays = nostrService.getRelayStatus()
        .filter(relay => relay.status === 'connected')
        .map(relay => relay.url);
      
      return communityService.createCommunity(
        name,
        description,
        nostrService.publicKey,
        connectedRelays
      );
    }
  },
  createProposal: {
    value: async (
      communityId: string,
      title: string,
      description: string,
      options: string[],
      category: string,
      minQuorum?: number,
      endsAt?: number
    ) => {
      const connectedRelays = nostrService.getRelayStatus()
        .filter(relay => relay.status === 'connected')
        .map(relay => relay.url);
      
      return communityService.createProposal(
        communityId,
        title,
        description,
        options,
        nostrService.publicKey,
        connectedRelays,
        category,
        minQuorum,
        endsAt
      );
    }
  },
  voteOnProposal: {
    value: async (proposalId: string, optionIndex: number) => {
      const connectedRelays = nostrService.getRelayStatus()
        .filter(relay => relay.status === 'connected')
        .map(relay => relay.url);
      
      return communityService.voteOnProposal(
        proposalId,
        optionIndex,
        nostrService.publicKey,
        connectedRelays
      );
    }
  },
  
  // Bookmark methods
  isBookmarked: {
    value: async (eventId: string) => {
      return bookmarkService.isBookmarked(eventId);
    }
  },
  addBookmark: {
    value: async (eventId: string, collectionId?: string, tags?: string[], note?: string) => {
      return bookmarkService.addBookmark(eventId, collectionId, tags, note);
    }
  },
  removeBookmark: {
    value: async (eventId: string) => {
      return bookmarkService.removeBookmark(eventId);
    }
  },
  getBookmarks: {
    value: async () => {
      return bookmarkService.getBookmarks();
    }
  },
  getBookmarkCollections: {
    value: async () => {
      return bookmarkService.getBookmarkCollections();
    }
  },
  getBookmarkMetadata: {
    value: async () => {
      return bookmarkService.getBookmarkMetadata();
    }
  },
  createBookmarkCollection: {
    value: async (name: string, color?: string, description?: string) => {
      return bookmarkService.createBookmarkCollection(name, color, description);
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
