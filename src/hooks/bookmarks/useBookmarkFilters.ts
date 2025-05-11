
import { useState, useMemo, useCallback } from 'react';
import { BookmarkCollection, BookmarkWithMetadata } from '@/lib/nostr/bookmark';

export type SortOption = 'newest' | 'oldest' | 'popular';

interface UseBookmarkFiltersProps {
  bookmarkedEvents: any[];
  profiles: Record<string, any>;
  bookmarkMetadata: BookmarkWithMetadata[];
}

interface UseBookmarkFiltersResult {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCollection: string | null;
  setSelectedCollection: (collection: string | null) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  viewMode: 'list' | 'grid';
  setViewMode: (mode: 'list' | 'grid') => void;
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
  bookmarkMetadata
}: UseBookmarkFiltersProps): UseBookmarkFiltersResult {
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // View state
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedCollection(null);
    setSelectedTags([]);
  }, []);

  // Remove a tag from selected tags
  const handleRemoveTag = useCallback((tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  }, []);

  // Filter events by search term, collection, and tags
  const filteredAndSortedEvents = useMemo(() => {
    // First filter events
    let filtered = bookmarkedEvents;
    
    // Filter by collection
    if (selectedCollection) {
      const eventsInCollection = bookmarkMetadata
        .filter(meta => meta.collectionId === selectedCollection)
        .map(meta => meta.eventId);
      
      filtered = filtered.filter(event => eventsInCollection.includes(event.id));
    }
    
    // Filter by tags
    if (selectedTags.length > 0) {
      const eventIdsWithTags = bookmarkMetadata
        .filter(meta => {
          const metaTags = meta.tags || [];
          return selectedTags.every(tag => metaTags.includes(tag));
        })
        .map(meta => meta.eventId);
      
      filtered = filtered.filter(event => eventIdsWithTags.includes(event.id));
    }
    
    // Filter by search term
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      
      filtered = filtered.filter(event => {
        // Check content
        if (event.content && event.content.toLowerCase().includes(lowerSearchTerm)) {
          return true;
        }
        
        // Check profile name/username if available
        const profile = profiles[event.pubkey];
        if (profile) {
          const name = profile.name?.toLowerCase();
          const displayName = profile.display_name?.toLowerCase();
          const about = profile.about?.toLowerCase();
          
          if (
            (name && name.includes(lowerSearchTerm)) ||
            (displayName && displayName.includes(lowerSearchTerm)) ||
            (about && about.includes(lowerSearchTerm))
          ) {
            return true;
          }
        }
        
        return false;
      });
    }
    
    // Sort events
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.created_at - a.created_at;
        case 'oldest':
          return a.created_at - b.created_at;
        case 'popular':
          // For now, we'll use created_at as a proxy for popularity
          // In a real app, this would be based on reactions, replies, etc.
          return b.created_at - a.created_at;
        default:
          return 0;
      }
    });
  }, [
    bookmarkedEvents,
    bookmarkMetadata,
    profiles,
    searchTerm,
    selectedCollection,
    selectedTags,
    sortBy
  ]);
  
  // Paginate events
  const paginatedEvents = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return filteredAndSortedEvents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedEvents, page, itemsPerPage]);
  
  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredAndSortedEvents.length / itemsPerPage);
  }, [filteredAndSortedEvents.length, itemsPerPage]);
  
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
