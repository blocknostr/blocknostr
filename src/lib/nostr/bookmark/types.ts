
// Basic types for bookmarks
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
  totalItems?: number;
}

// Operation types for offline support
export type BookmarkOperationType = 'add' | 'remove' | 'update' | 'addCollection' | 'updateCollection' | 'deleteCollection';

export interface QueuedOperation {
  id: string;
  type: BookmarkOperationType;
  data: Record<string, any>;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  retryCount: number;
  timestamp: number;
}

// Event kinds for Nostr events
export enum BookmarkEventKinds {
  BOOKMARK_LIST = 30001,
  BOOKMARK_COLLECTIONS = 30002,
  BOOKMARK_METADATA = 30003,
  BOOKMARKS = 30001,
  COLLECTIONS = 30002,
  METADATA = 30003,
  DELETE = 5
}

// Filter types
export interface BookmarkFilters {
  collections?: string[];
  tags?: string[];
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  search?: string;
}

// Dependencies for the bookmark manager
export interface BookmarkManagerDependencies {
  publishEvent: (event: any) => Promise<string | null>;
  getEvents: (filters: any[], relays?: string[]) => Promise<any[]>;
}
