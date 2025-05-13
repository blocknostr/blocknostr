
// Basic types for bookmarks - empty stubs for backward compatibility
export interface BookmarkStatus {
  eventId: string;
  isBookmarked: boolean;
  lastUpdated: number;
}

export interface BookmarkWithMetadata {
  eventId: string;
  collectionId?: string;
  tags?: string[];
  note?: string;
  createdAt: number;
}

export interface BookmarkCollection {
  id: string;
  name: string;
  color?: string;
  description?: string;
  createdAt: number;
  updatedAt?: number;
  totalItems?: number;
}

// Placeholder types for backward compatibility
export type BookmarkOperationType = 'add' | 'remove' | 'update' | 'addCollection' | 'updateCollection' | 'deleteCollection';

export interface QueuedOperation {
  id: string;
  type: BookmarkOperationType;
  data: Record<string, any>;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  retryCount: number;
  timestamp: number;
}

// NIP-51 compliant bookmark types - use LIST from constants
export enum BookmarkEventKinds {
  BOOKMARK_LIST = 10000,
  COLLECTIONS = 10000
}

export interface BookmarkManagerDependencies {
  publishEvent: (event: any) => Promise<string | null>;
  getEvents: (filters: any[], relays?: string[]) => Promise<any[]>;
}
