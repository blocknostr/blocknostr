
// Empty stub types for backward compatibility during removal process
export interface BookmarkWithMetadata {
  eventId: string;
  collectionId?: string;
  tags?: string[];
  note?: string;
}

export interface BookmarkCollection {
  id: string;
  name: string;
  color?: string;
  description?: string;
}

// Simple facade for remaining imports
export class BookmarkManagerFacade {
  async isBookmarked(): Promise<boolean> {
    return false;
  }
  
  async addBookmark(): Promise<boolean> {
    return false;
  }
  
  async removeBookmark(): Promise<boolean> {
    return false;
  }
  
  async getBookmarkList(): Promise<string[]> {
    return [];
  }
  
  async getCollections(): Promise<BookmarkCollection[]> {
    return [];
  }
  
  async getBookmarkMetadata(): Promise<BookmarkWithMetadata[]> {
    return [];
  }
  
  async createCollection(): Promise<string | null> {
    return null;
  }
  
  async processPendingOperations(): Promise<void> {
    return;
  }
}
