
import React from "react";
import { NostrEvent, BookmarkWithMetadata, BookmarkCollection } from "@/lib/nostr";
import NoteCard from "@/components/NoteCard";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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
  filteredAndSortedEvents
}) => {
  if (!isLoggedIn) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">
          You need to log in to see your bookmarks
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span className="text-muted-foreground">Loading bookmarks...</span>
      </div>
    );
  }

  if (filteredAndSortedEvents.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">
          {searchTerm || selectedCollection || selectedTags.length > 0 
            ? "No bookmarks match your filters."
            : "No bookmarks yet. Click the bookmark icon on any post to save it here."}
        </p>
        {(searchTerm || selectedCollection || selectedTags.length > 0) && (
          <Button variant="outline" className="mt-4" onClick={handleResetFilters}>
            Clear filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
        {paginatedEvents.map(event => {
          // Find metadata for this event
          const metadata = bookmarkMetadata.find(meta => meta.eventId === event.id);
          const collection = metadata?.collectionId 
            ? collections.find(c => c.id === metadata.collectionId)
            : null;
            
          return (
            <div key={event.id} className="relative">
              {collection && (
                <div 
                  className="absolute top-0 right-0 z-10 -mt-1 -mr-1 px-2 py-0.5 rounded-full text-xs" 
                  style={{ backgroundColor: collection.color || '#3b82f6', color: '#fff' }}
                >
                  {collection.name}
                </div>
              )}
              <NoteCard 
                event={event} 
                profileData={profiles[event.pubkey]}
              />
            </div>
          );
        })}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setPage(Math.max(1, page - 1))}
                className={page === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  isActive={page === i + 1}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                className={page === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </>
  );
};

export default BookmarksList;
