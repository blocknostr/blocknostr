
import { useState, useMemo } from "react";
import { NostrEvent } from "@/lib/nostr";
import { BookmarkWithMetadata } from "@/lib/nostr";

interface UseBookmarkFiltersProps {
  bookmarkedEvents: NostrEvent[];
  profiles: Record<string, any>;
  bookmarkMetadata: BookmarkWithMetadata[];
}

export type SortOption = "newest" | "oldest" | "popular";

export const useBookmarkFilters = ({ 
  bookmarkedEvents, 
  profiles, 
  bookmarkMetadata 
}: UseBookmarkFiltersProps) => {
  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  // Filter and sort bookmarks
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = [...bookmarkedEvents];
    
    // Filter by search term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(event => 
        event.content.toLowerCase().includes(lowerSearch) ||
        profiles[event.pubkey]?.name?.toLowerCase().includes(lowerSearch) ||
        profiles[event.pubkey]?.display_name?.toLowerCase().includes(lowerSearch)
      );
    }
    
    // Filter by collection
    if (selectedCollection) {
      const eventIdsInCollection = bookmarkMetadata
        .filter(meta => meta.collectionId === selectedCollection)
        .map(meta => meta.eventId);
      
      filtered = filtered.filter(event => eventIdsInCollection.includes(event.id));
    }
    
    // Filter by tags
    if (selectedTags.length > 0) {
      const eventIdsWithTags = bookmarkMetadata
        .filter(meta => 
          meta.tags?.some(tag => selectedTags.includes(tag))
        )
        .map(meta => meta.eventId);
      
      filtered = filtered.filter(event => eventIdsWithTags.includes(event.id));
    }
    
    // Sort events
    return filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return b.created_at - a.created_at;
      } else if (sortBy === "oldest") {
        return a.created_at - b.created_at;
      }
      // For "popular" or any other sort option, we would add logic here
      // Default to newest
      return b.created_at - a.created_at;
    });
  }, [bookmarkedEvents, searchTerm, selectedCollection, selectedTags, sortBy, profiles, bookmarkMetadata]);
  
  // Pagination
  const paginatedEvents = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedEvents, page]);
  
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedEvents.length / ITEMS_PER_PAGE));
  
  // Handle removing a tag filter
  const handleRemoveTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };
  
  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCollection(null);
    setSelectedTags([]);
    setPage(1);
  };

  return {
    searchTerm,
    setSearchTerm,
    selectedCollection,
    setSelectedCollection,
    selectedTags,
    setSelectedTags,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy: (sort: SortOption) => setSortBy(sort),
    page,
    setPage,
    paginatedEvents,
    filteredAndSortedEvents,
    totalPages,
    handleRemoveTag,
    handleResetFilters
  };
};
