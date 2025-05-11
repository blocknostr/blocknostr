
export type BookmarkOperationType = 'add' | 'remove' | 'addCollection';

export interface RelayConnectionOptions {
  maxAttempts?: number; 
  timeout?: number;
  onProgress?: (message: string) => void;
}

export interface BookmarkCollection {
  id: string;
  name: string;
  color?: string;
  description?: string;
  createdAt: number;
  updatedAt?: number;
  totalItems?: number; // Add this to fix errors
}

export interface BookmarkWithMetadata {
  eventId: string;
  metadataId: string;
  collectionId?: string; // Add this to fix errors
  tags: string[];
  note?: string;
}

export type BookmarkStatus = 'bookmarked' | 'not_bookmarked';

export interface BookmarkFilters {
  limit?: number;
  since?: number;
  until?: number;
  collectionId?: string;
  searchTerm?: string;
}

export interface PendingOperation {
  id: string;
  type: BookmarkOperationType;
  data: any;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  attempts: number;
  timestamp: number;
}

// Fix for QueuedOperation
export interface QueuedOperation {
  type: "add" | "remove" | "addCollection";
  data: any;
  timestamp: number;
}

// Add missing BookmarkManagerDependencies interface
export interface BookmarkManagerDependencies {
  publishEvent: (pool: any, publicKey: string | null, privateKey: string | null | undefined, event: any, relays: string[]) => Promise<string | null>;
}

// Add BookmarkEventKinds enum
export enum BookmarkEventKinds {
  BOOKMARKS = 30001,
  BOOKMARK_COLLECTIONS = 30003,
  BOOKMARK_METADATA = 30004
}
