
import { useState, useMemo } from 'react';
import { NostrEvent } from '@/lib/nostr';
import { BookmarkWithMetadata } from '@/lib/nostr/bookmark/types';
import { extractTagsFromEvent } from '@/lib/nostr/bookmark/utils/bookmark-utils';

interface UseBookmarkFiltersProps {
  events: NostrEvent[];
  collections: any[];
  metadata: BookmarkWithMetadata[];
  perPage?: number;
}

export function useBookmarkFilters({
  events,
  collections,
  metadata,
  perPage = 10
}: UseBookmarkFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [sortMethod, setSortMethod] = useState<'newest' | 'oldest'>('newest');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Get all unique tags across events
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    
    // Collect tags from metadata
    metadata.forEach(meta => {
      if (meta.tags && Array.isArray(meta.tags)) {
        meta.tags.forEach(tag => tags.add(tag));
      }
    });
    
    // Collect tags from events too
    events.forEach(event => {
      const eventTags = extractTagsFromEvent(event);
      eventTags.forEach(tag => tags.add(tag));
    });
    
    return Array.from(tags).sort();
  }, [events, metadata]);
  
  // Filter events based on search, collection and tags
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = [...events];
    
    // Filter by collection
    if (selectedCollection) {
      // First get all event IDs in the collection
      const eventIdsInCollection = metadata
        .filter(meta => meta.collectionId === selectedCollection)
        .map(meta => meta.eventId);
      
      // Then filter events by those IDs
      filtered = filtered.filter(event => eventIdsInCollection.includes(event.id || ''));
    }
    
    // Filter by tags
    if (selectedTags.length > 0) {
      // Get events that have any of the selected tags
      filtered = filtered.filter(event => {
        // Get this event's metadata
        const meta = metadata.find(m => m.eventId === event.id);
        
        if (!meta || !meta.tags) return false;
        
        // Check if any selected tag is in this event's tags
        return selectedTags.some(tag => meta.tags.includes(tag));
      });
    }
    
    // Filter by search term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(event => 
        event.content.toLowerCase().includes(lowerSearch)
      );
    }
    
    // Sort by date
    filtered.sort((a, b) => {
      if (sortMethod === 'newest') {
        return b.created_at - a.created_at;
      } else {
        return a.created_at - b.created_at;
      }
    });
    
    return filtered;
  }, [events, searchTerm, selectedCollection, selectedTags, sortMethod, metadata]);
  
  // Paginate events
  const paginatedEvents = useMemo(() => {
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    return filteredAndSortedEvents.slice(startIndex, endIndex);
  }, [filteredAndSortedEvents, page, perPage]);
  
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredAndSortedEvents.length / perPage));
  }, [filteredAndSortedEvents, perPage]);
  
  // Reset page when filters change
  const resetPage = () => setPage(1);
  
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCollection(null);
    setSelectedTags([]);
    resetPage();
  };
  
  return {
    searchTerm,
    setSearchTerm,
    selectedCollection,
    setSelectedCollection,
    selectedTags,
    setSelectedTags,
    page,
    setPage,
    sortMethod,
    setSortMethod,
    viewMode,
    setViewMode,
    paginatedEvents,
    totalPages,
    filteredAndSortedEvents,
    allTags,
    resetPage,
    handleResetFilters
  };
}
