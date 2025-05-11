
import React from "react";
import { NostrEvent, BookmarkWithMetadata, BookmarkCollection } from "@/lib/nostr";
import NoteCard from "@/components/NoteCard";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, WifiOff, AlertTriangle } from "lucide-react";

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

const BookmarksList: React.FC<BookmarksListProps> = ({
  loading,
  isLoggedIn,
  paginatedEvents,
  bookmarkMetadata,
  collections,
  profiles,
  viewMode,
  page,
  setPage,
  totalPages,
  searchTerm,
  selectedCollection,
  selectedTags,
  handleResetFilters,
  filteredAndSortedEvents,
  error = null,
  networkStatus = 'online',
  refreshBookmarks
}) => {
  if (!isLoggedIn) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">
          You need to log in to see your bookmarks
        </p>
      </div>
    );
  }
  
  // Show network status indicator if offline or limited
  const renderNetworkStatus = () => {
    if (networkStatus === 'offline') {
      return (
        <div className="flex items-center justify-center space-x-2 py-2 px-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-md mb-4">
          <WifiOff className="h-4 w-4" />
          <span className="text-sm">You're offline. Showing cached bookmarks.</span>
        </div>
      );
    } 
    
    if (networkStatus === 'limited') {
      return (
        <div className="flex items-center justify-center space-x-2 py-2 px-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-md mb-4">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">Limited connectivity. Some data may be outdated.</span>
        </div>
      );
    }
    
    return null;
  };
  
  // Show refresh button if we have a refresh function
  const renderRefreshButton = () => {
    if (refreshBookmarks) {
      return (
        <Button 
          variant="outline" 
          size="sm" 
          className="ml-2"
          onClick={() => refreshBookmarks()}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      );
    }
    return null;
  };

  if (loading && paginatedEvents.length === 0) {
    return (
      <div className="py-8 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin mb-3 text-primary" />
        <span className="text-sm text-muted-foreground">Loading your bookmarks...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="py-8 text-center">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive" />
        <p className="text-sm text-muted-foreground mb-3">{error}</p>
        {renderRefreshButton()}
      </div>
    );
  }

  if (filteredAndSortedEvents.length === 0) {
    return (
      <div className="py-8 text-center">
        {renderNetworkStatus()}
        <p className="text-sm text-muted-foreground mb-3">
          {searchTerm || selectedCollection || selectedTags.length > 0 
            ? "No bookmarks match your filters."
            : "No bookmarks yet. Click the bookmark icon on any post to save it here."}
        </p>
        
        <div className="flex items-center justify-center space-x-2">
          {(searchTerm || selectedCollection || selectedTags.length > 0) && (
            <Button variant="outline" className="text-xs h-8" onClick={handleResetFilters}>
              Clear filters
            </Button>
          )}
          {renderRefreshButton()}
        </div>
      </div>
    );
  }

  return (
    <>
      {renderNetworkStatus()}
      
      {loading && paginatedEvents.length > 0 && (
        <div className="flex items-center justify-center py-2 mb-4 bg-primary-100/10 rounded-md">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-xs text-muted-foreground">Updating bookmarks...</span>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">
          {filteredAndSortedEvents.length} {filteredAndSortedEvents.length === 1 ? 'bookmark' : 'bookmarks'}
        </p>
        {renderRefreshButton()}
      </div>
      
      <div className={`mt-4 ${viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" : "space-y-3"}`}>
        {paginatedEvents.map(event => {
          // Find metadata for this event
          const metadata = bookmarkMetadata.find(meta => meta.eventId === event.id);
          // Fixed code to handle optional collectionId
          const collectionId = metadata?.collectionId;
          const collection = collectionId 
            ? collections.find(c => c.id === collectionId)
            : null;
            
          return (
            <div key={event.id} className="relative">
              {collection && (
                <div 
                  className="absolute top-0 right-0 z-10 -mt-1 -mr-1 px-1.5 py-0.5 rounded-full text-xs" 
                  style={{ backgroundColor: collection.color || '#3b82f6', color: '#fff' }}
                >
                  {collection.name}
                </div>
              )}
              <div className="transform transition-transform hover:scale-[1.01]">
                <NoteCard 
                  event={event} 
                  profileData={profiles[event.pubkey]}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setPage(Math.max(1, page - 1))}
                className={`${page === 1 ? "pointer-events-none opacity-50" : ""} text-xs`}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  isActive={page === i + 1}
                  onClick={() => setPage(i + 1)}
                  className="text-xs h-7 w-7"
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                className={`${page === totalPages ? "pointer-events-none opacity-50" : ""} text-xs`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </>
  );
};

export default BookmarksList;
