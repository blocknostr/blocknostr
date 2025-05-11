
/**
 * Type for bookmark collection
 */
export interface BookmarkCollection {
  id: string;
  name: string;
  color?: string;
  description?: string;
  eventCount?: number;
  createdAt?: number;
  updatedAt?: number;
  totalItems?: number;
}

/**
 * Type for bookmark with metadata
 */
export interface BookmarkWithMetadata {
  eventId: string;
  title?: string;
  summary?: string;
  author?: string;
  authorName?: string;
  profileImage?: string;
  createdAt?: number;
  tags?: string[];
  collectionId?: string;
  note?: string;
  content?: string;
}

/**
 * Status of a bookmark operation
 */
export type BookmarkStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Type for pending bookmark operations that will be processed when online
 */
export interface PendingOperation {
  id: string;
  type: 'add' | 'remove' | 'create_collection' | 'addCollection';
  eventId?: string;
  collectionId?: string;
  name?: string;
  color?: string;
  description?: string;
  tags?: string[];
  note?: string;
  status: BookmarkStatus;
  attempts: number;
  // Field to store operation-specific data
  eventId?: string;
  collectionId?: string;
  tags?: string[];
  note?: string;
}

/**
 * Enum for bookmark event kinds used in Nostr
 */
export enum BookmarkEventKinds {
  BOOKMARK_LIST = 30001,
  BOOKMARK_COLLECTIONS = 30002,
  BOOKMARK_METADATA = 30003,
  DELETE = 5
}

/**
 * Type for relay connection options
 */
export interface RelayConnectionOptions {
  maxAttempts?: number;
  timeout?: number;
  onProgress?: (message: string) => void;
}

/**
 * Interface for bookmark manager dependencies
 */
export interface BookmarkManagerDependencies {
  publishEvent: (
    pool: any,
    publicKey: string | null,
    privateKey: string | null | undefined,
    event: any,
    relays: string[]
  ) => Promise<string | null>;
}

/**
 * Type for bookmark filters 
 */
export interface BookmarkFilters {
  collectionId?: string;
  tags?: string[];
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'popular';
}

/**
 * Type for bookmark operation types
 */
export type BookmarkOperationType = 'add' | 'remove' | 'create_collection' | 'addCollection';
