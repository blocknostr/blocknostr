
/**
 * Type for bookmark collection
 */
export interface BookmarkCollection {
  id: string;
  name: string;
  color?: string;
  description?: string;
  eventCount?: number;
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
  type: 'add' | 'remove' | 'create_collection';
  eventId?: string;
  collectionId?: string;
  name?: string;
  color?: string;
  description?: string;
  tags?: string[];
  note?: string;
  status: BookmarkStatus;
  attempts: number;
}
