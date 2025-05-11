
export type BookmarkOperationType = 'add' | 'remove' | 'update' | 'collection-add' | 'collection-update' | 'collection-remove';

export interface QueuedOperation {
  id: string;
  timestamp: number;
  type: BookmarkOperationType;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  retryCount: number;
  data: any;
}

export interface BookmarkCollection {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: number;
  updatedAt?: number;
  totalItems: number;
}

export interface BookmarkWithMetadata {
  eventId: string;
  note?: string;
  tags?: string[];
  createdAt: number;
  collectionId?: string;
}

export type BookmarkStatus = 'bookmarked' | 'unbookmarked' | 'pending' | 'processing' | 'failed' | 'completed';

export interface BookmarkFilters {
  searchTerm?: string;
  tags?: string[];
  collections?: string[];
  before?: Date;
  after?: Date;
}

export enum BookmarkEventKinds {
  BOOKMARKS = 30001,
  COLLECTIONS = 30003,
  BOOKMARK_COLLECTIONS = 30003, // Alias for COLLECTIONS
  METADATA = 30004,
  BOOKMARK_METADATA = 30004, // Alias for METADATA
  DELETE = 5,
}

export interface BookmarkManagerDependencies {
  publishEvent: (event: any) => Promise<string>;
  getEvents: (filters: any[], relays?: string[]) => Promise<any[]>;
}
