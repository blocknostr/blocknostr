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
}

export interface BookmarkWithMetadata {
  eventId: string;
  metadataId: string;
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
  data: any; // Add this to fix the errors
  status: 'pending' | 'processing' | 'failed' | 'completed';
  attempts: number;
  timestamp: number;
}

// Fix for QueuedOperation
export interface QueuedOperation {
  type: "add" | "remove" | "addCollection";
  data: any; // Add this to allow the data property
  timestamp: number;
}

export type BookmarkOperationType = 'add' | 'remove' | 'addCollection';
