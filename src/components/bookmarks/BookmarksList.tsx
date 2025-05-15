
import React from "react";
import { NostrEvent } from "@/lib/nostr";
import { BookmarkCollection, BookmarkWithMetadata } from "@/lib/nostr/bookmark";
import { AlertTriangle } from "lucide-react";

// Note: This file is no longer used - kept for backward compatibility
interface BookmarksListProps {
  loading: boolean;
  isLoggedIn: boolean;
  paginatedEvents: NostrEvent[];
  bookmarkMetadata: BookmarkWithMetadata[];
  collections: BookmarkCollection[];
  profiles: Record<string, any>;
  viewMode: "list" | "grid";
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  searchTerm: string;
  selectedCollection: string | null;
  selectedTags: string[];
  handleResetFilters: () => void;
  filteredAndSortedEvents: NostrEvent[];
  error?: string | null;
  networkStatus?: 'online' | 'offline' | 'limited';
  refreshBookmarks?: () => Promise<void>;
}

const BookmarksList: React.FC = () => {
  // This component is deprecated and no longer functional
  return (
    <div className="py-8 text-center">
      <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive" />
      <p className="text-sm text-muted-foreground mb-3">
        Bookmark functionality has been removed
      </p>
    </div>
  );
};

export default BookmarksList;
