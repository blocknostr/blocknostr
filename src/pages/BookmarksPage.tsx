import { useEffect, useState, useMemo } from "react";
import { NostrEvent, nostrService, BookmarkWithMetadata, BookmarkCollection } from "@/lib/nostr";
import NoteCard from "@/components/NoteCard";
import { Loader2, Search, Plus, Filter, X, Bookmark, Grid3X3, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

const BookmarksPage = () => {
  // Main state
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [bookmarkedEvents, setBookmarkedEvents] = useState<NostrEvent[]>([]);
  const [bookmarkMetadata, setBookmarkMetadata] = useState<BookmarkWithMetadata[]>([]);
  const [collections, setCollections] = useState<BookmarkCollection[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const isLoggedIn = !!nostrService.publicKey;

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  // Collection dialog state
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionColor, setNewCollectionColor] = useState("#3b82f6");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");

  // Fetch bookmarks, collections, and metadata on mount
  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    
    const fetchBookmarkData = async () => {
      try {
        // Fetch bookmarks
        const bookmarkIds = await nostrService.getBookmarks();
        setBookmarks(bookmarkIds);
        
        // Fetch collections
        const collectionsList = await nostrService.getBookmarkCollections();
        setCollections(collectionsList);
        
        // Fetch bookmark metadata
        const metadata = await nostrService.getBookmarkMetadata();
        setBookmarkMetadata(metadata);
        
        if (bookmarkIds.length === 0) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching bookmark data:", error);
        setLoading(false);
      }
    };
    
    fetchBookmarkData();
  }, [isLoggedIn]);
  
  // Fetch bookmarked events
  useEffect(() => {
    if (bookmarks.length === 0) return;
    
    const fetchEvents = async () => {
      try {
        await nostrService.connectToUserRelays();
        
        const subId = nostrService.subscribe(
          [
            {
              ids: bookmarks,
              kinds: [1], // Regular notes
            }
          ],
          (event) => {
            setBookmarkedEvents(prev => {
              if (prev.some(e => e.id === event.id)) {
                return prev;
              }
              return [...prev, event];
            });
            
            // Fetch profile data for this event
            if (event.pubkey && !profiles[event.pubkey]) {
              fetchProfileData(event.pubkey);
            }
          }
        );
        
        // Set a timeout to close the subscription
        setTimeout(() => {
          nostrService.unsubscribe(subId);
          setLoading(false);
        }, 5000);
        
        return () => {
          nostrService.unsubscribe(subId);
        };
      } catch (error) {
        console.error("Error fetching bookmarked events:", error);
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [bookmarks]);
  
  const fetchProfileData = (pubkey: string) => {
    const metadataSubId = nostrService.subscribe(
      [
        {
          kinds: [0],
          authors: [pubkey],
          limit: 1
        }
      ],
      (event) => {
        try {
          const metadata = JSON.parse(event.content);
          setProfiles(prev => ({
            ...prev,
            [pubkey]: metadata
          }));
        } catch (e) {
          console.error('Failed to parse profile metadata:', e);
        }
      }
    );
    
    // Cleanup subscription after a short time
    setTimeout(() => {
      nostrService.unsubscribe(metadataSubId);
    }, 3000);
  };

  // Handle creating a new collection
  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      toast.error("Collection name is required");
      return;
    }
    
    try {
      const collectionId = await nostrService.createBookmarkCollection(
        newCollectionName.trim(),
        newCollectionColor,
        newCollectionDescription.trim() || undefined
      );
      
      if (collectionId) {
        // Refresh collections
        const updatedCollections = await nostrService.getBookmarkCollections();
        setCollections(updatedCollections);
        
        // Reset form
        setNewCollectionName("");
        setNewCollectionColor("#3b82f6");
        setNewCollectionDescription("");
        setIsCollectionDialogOpen(false);
      }
    } catch (error) {
      console.error("Error creating collection:", error);
      toast.error("Failed to create collection");
    }
  };
  
  // Get all unique tags from bookmarks
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    bookmarkMetadata.forEach(meta => {
      if (meta.tags?.length) {
        meta.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet);
  }, [bookmarkMetadata]);
  
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
    return filtered.sort((a, b) => 
      sortBy === "newest" 
        ? b.created_at - a.created_at 
        : a.created_at - b.created_at
    );
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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="border-b pb-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Bookmark className="h-5 w-5" />
              Bookmarks
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your saved notes appear here
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className={viewMode === "list" ? "bg-muted" : ""}
              onClick={() => setViewMode("list")}
            >
              <ListFilter className="h-4 w-4 mr-1" />
              List
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={viewMode === "grid" ? "bg-muted" : ""}
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4 mr-1" />
              Grid
            </Button>
            
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as "newest" | "oldest")}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {isLoggedIn && (
          <div className="mt-4 flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookmarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <div className="flex gap-2 items-center flex-wrap">
              <Select
                value={selectedCollection || "all"}
                onValueChange={(value) => setSelectedCollection(value === "all" ? null : value)}
              >
                <SelectTrigger className="w-[150px] md:w-[180px]">
                  <SelectValue placeholder="All collections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All collections</SelectItem>
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Dialog open={isCollectionDialogOpen} onOpenChange={setIsCollectionDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Collection
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create new collection</DialogTitle>
                    <DialogDescription>
                      Create a new collection to organize your bookmarks.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="collection-name">Name</Label>
                      <Input
                        id="collection-name"
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        placeholder="e.g., Programming, Articles, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="collection-color">Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="collection-color"
                          type="color"
                          value={newCollectionColor}
                          onChange={(e) => setNewCollectionColor(e.target.value)}
                          className="w-12 h-10 p-1"
                        />
                        <span className="text-sm">{newCollectionColor}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="collection-description">Description (optional)</Label>
                      <Input
                        id="collection-description"
                        value={newCollectionDescription}
                        onChange={(e) => setNewCollectionDescription(e.target.value)}
                        placeholder="Brief description of this collection"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCollectionDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateCollection}>Create Collection</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-1" />
                    Tags
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Filter by tags</DialogTitle>
                    <DialogDescription>
                      Select tags to filter your bookmarks.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-wrap gap-2 py-4 max-h-[200px] overflow-y-auto">
                    {allTags.map((tag) => (
                      <Button
                        key={tag}
                        variant={selectedTags.includes(tag) ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (selectedTags.includes(tag)) {
                            setSelectedTags(prev => prev.filter(t => t !== tag));
                          } else {
                            setSelectedTags(prev => [...prev, tag]);
                          }
                        }}
                      >
                        {tag}
                      </Button>
                    ))}
                    {allTags.length === 0 && (
                      <p className="text-sm text-muted-foreground">No tags found</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSelectedTags([])}>Clear</Button>
                    <Button>Apply</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              {(searchTerm || selectedCollection || selectedTags.length > 0) && (
                <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}
        
        {/* Active filters */}
        {selectedTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedTags.map(tag => (
              <div 
                key={tag}
                className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1"
              >
                {tag}
                <button 
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-primary"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {!isLoggedIn ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            You need to log in to see your bookmarks
          </p>
        </div>
      ) : loading ? (
        <div className="py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span className="text-muted-foreground">Loading bookmarks...</span>
        </div>
      ) : filteredAndSortedEvents.length === 0 ? (
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
      ) : (
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
                    onClick={() => setPage(p => Math.max(1, p - 1))}
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
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
};

export default BookmarksPage;
