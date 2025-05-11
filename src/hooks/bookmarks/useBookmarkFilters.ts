
import { useState, useEffect, useMemo } from "react";
import { SortOption } from "@/components/bookmark/BookmarkHeader";

const ITEMS_PER_PAGE = 9;

interface UseBookmarkFiltersParams {
  bookmarkedEvents: any[];
  profiles: Record<string, any>;
  bookmarkMetadata: any[];
}

interface UseBookmarkFiltersResult {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCollection: string | null;
  setSelectedCollection: (collection: string | null) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  viewMode: "list" | "grid";
  setViewMode: (mode: "list" | "grid") => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  page: number;
  setPage: (page: number) => void;
  paginatedEvents: any[];
  filteredAndSortedEvents: any[];
  totalPages: number;
  handleRemoveTag: (tag: string) => void;
  handleResetFilters: () => void;
}

export function useBookmarkFilters({
  bookmarkedEvents,
  profiles,
  bookmarkMetadata,
}: UseBookmarkFiltersParams): UseBookmarkFiltersResult {
  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Display state
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);
  
  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCollection, selectedTags, sortBy]);

  // Filter, sort, and paginate events
  const filteredAndSortedEvents = useMemo(() => {
    // First filter events
    let filtered = [...bookmarkedEvents];
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(event => {
        const content = event.content?.toLowerCase() || "";
        const author = profiles[event.pubkey]?.name?.toLowerCase() || "";
        
        return content.includes(term) || author.includes(term);
      });
    }
    
    // Filter by collection
    if (selectedCollection) {
      const relevantEventIds = bookmarkMetadata
        .filter(meta => meta.collectionId === selectedCollection)
        .map(meta => meta.eventId);
      
      filtered = filtered.filter(event => relevantEventIds.includes(event.id));
    }
    
    // Filter by tags
    if (selectedTags.length > 0) {
      const relevantEventIds = bookmarkMetadata
        .filter(meta => {
          if (!meta.tags) return false;
          return selectedTags.some(tag => meta.tags.includes(tag));
        })
        .map(meta => meta.eventId);
      
      filtered = filtered.filter(event => {
        // Check event tags
        const eventHasTag = event.tags
          ?.some(tag => tag[0] === 't' && selectedTags.includes(tag[1]));
        
        // Check metadata tags
        const eventInMetadataTags = relevantEventIds.includes(event.id);
        
        return eventHasTag || eventInMetadataTags;
      });
    }
    
    // Then sort events
    return filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return b.created_at - a.created_at;
      } else if (sortBy === "oldest") {
        return a.created_at - b.created_at;
      } else { // "popular" - could improve with real metrics later
        // For now sort by number of tags + collection assignment as a simple "popularity" metric
        const aMetadata = bookmarkMetadata.find(meta => meta.eventId === a.id);
        const bMetadata = bookmarkMetadata.find(meta => meta.eventId === b.id);
        
        const aScore = (aMetadata?.tags?.length || 0) + (aMetadata?.collectionId ? 3 : 0);
        const bScore = (bMetadata?.tags?.length || 0) + (bMetadata?.collectionId ? 3 : 0);
        
        return bScore - aScore;
      }
    });
  }, [bookmarkedEvents, profiles, bookmarkMetadata, searchTerm, selectedCollection, selectedTags, sortBy]);
  
  // Calculate total pages and paginate events
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedEvents.length / ITEMS_PER_PAGE));
  
  // Ensure current page is valid
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);
  
  // Get paginated events for current page
  const paginatedEvents = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedEvents, page]);
  
  // Helper functions
  const handleRemoveTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };
  
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
    setSortBy,
    page,
    setPage,
    paginatedEvents,
    filteredAndSortedEvents,
    totalPages,
    handleRemoveTag,
    handleResetFilters
  };
}
