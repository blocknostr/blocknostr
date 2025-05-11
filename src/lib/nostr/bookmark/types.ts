
import { SimplePool } from 'nostr-tools';
import { EVENT_KINDS } from '../constants';

/**
 * Types for bookmark functionality
 */

export type BookmarkOperationType = 'add' | 'remove' | 'update' | 'addCollection';

export type BookmarkStatus = 'pending' | 'completed' | 'failed';

export interface BookmarkCollection {
  id: string;
  name: string;
  color?: string;
  description?: string;
  totalItems: number;
  createdAt: number;
  updatedAt?: number;
}

export interface BookmarkWithMetadata {
  eventId: string;
  collectionId?: string;
  tags?: string[];
  note?: string;
  createdAt: number;
}

export interface PendingOperation {
  id: string;
  type: BookmarkOperationType;
  data: Record<string, any>;
  timestamp: number;
  status: BookmarkStatus;
  attempts: number;
}

export interface BookmarkManagerDependencies {
  publishEvent: (
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null | undefined,
    event: any,
    relays: string[]
  ) => Promise<string | null>;
}

export interface RelayConnectionOptions {
  timeout?: number;
  maxRetries?: number;
  onProgress?: (message: string) => void;
}

export interface BookmarkFilters {
  searchTerm?: string;
  collectionId?: string | null;
  tags?: string[];
}

export interface BookmarkEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

// Common event types used in bookmark operations
export const BookmarkEventKinds = {
  BOOKMARKS: EVENT_KINDS.BOOKMARKS,
  BOOKMARK_METADATA: EVENT_KINDS.BOOKMARK_METADATA,
  BOOKMARK_COLLECTIONS: EVENT_KINDS.BOOKMARK_COLLECTIONS,
  DELETE: EVENT_KINDS.DELETE
};
