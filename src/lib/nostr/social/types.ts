
import { SimplePool } from 'nostr-tools';
import { NostrEvent } from '../types';

/**
 * Interface for reaction counts on an event
 */
export interface ReactionCounts {
  likes: number;
  reposts: number;
  userHasLiked: boolean;
  userHasReposted: boolean;
  likers: string[];
}

/**
 * Interface for contact list data
 */
export interface ContactList {
  pubkeys: string[];
  tags: string[][];
  content: string;
}
