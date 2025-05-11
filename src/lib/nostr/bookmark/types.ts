
// Additional types for the bookmark functionality

export type BookmarkStatus = 'bookmarked' | 'not_bookmarked' | 'unknown';

export type BookmarkOperationType = 'add' | 'remove' | 'addCollection' | 'updateMetadata';

export interface BookmarkCollection {
  id: string;
  name: string;
  color?: string;
  description?: string;
  totalItems?: number;
  createdAt: number;
  updatedAt?: number;
}

export interface BookmarkWithMetadata {
  eventId: string;
  collectionId?: string;
  tags?: string[];
  note?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface QueuedOperation {
  id: string;
  type: BookmarkOperationType;
  data: any;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  retryCount: number;
  timestamp: number;
}

export interface BookmarkEventKinds {
  BOOKMARK_LIST: number;
  BOOKMARK_COLLECTIONS: number;
  BOOKMARK_METADATA: number;
}

export const BookmarkEventKinds = {
  BOOKMARK_LIST: 10003,
  BOOKMARK_COLLECTIONS: 30001, 
  BOOKMARK_METADATA: 30002
};

export interface BookmarkManagerDependencies {
  publishEvent: (event: any) => Promise<any>;
  getEvents: (filters: any[], relays?: string[]) => Promise<any[]>;
}
