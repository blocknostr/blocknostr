
// Basic types for bookmarks
import { EVENT_KINDS, LIST_IDENTIFIERS } from '../constants';

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

// Operation types
export type BookmarkOperationType = 'add' | 'remove' | 'update' | 'addCollection' | 'updateCollection' | 'deleteCollection';

export interface QueuedOperation {
  id: string;
  type: BookmarkOperationType;
  data: Record<string, any>;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  retryCount: number;
  timestamp: number;
}

// NIP-51 compliant bookmark types
export enum BookmarkEventKinds {
  BOOKMARK_LIST = EVENT_KINDS.LIST,
  COLLECTIONS = EVENT_KINDS.LIST
}

export interface BookmarkManagerDependencies {
  publishEvent: (event: any) => Promise<string | null>;
  getEvents: (filters: any[], relays?: string[]) => Promise<any[]>;
}
