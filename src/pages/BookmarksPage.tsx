
import { useState } from "react";
import { toast } from "sonner";

import { useBookmarkData } from "@/hooks/bookmarks/useBookmarkData";
import { useBookmarkFilters } from "@/hooks/bookmarks/useBookmarkFilters";

import BookmarkHeader from "@/components/bookmarks/BookmarkHeader";
import BookmarkFilters from "@/components/bookmarks/BookmarkFilters";
import BookmarksList from "@/components/bookmarks/BookmarksList";

const BookmarksPage = () => {
  // Fetch bookmark data
  const {
    bookmarkedEvents,
    bookmarkMetadata,
    collections,
    profiles,
    loading,
    isLoggedIn,
    allTags,
    createCollection
  } = useBookmarkData();

  // Filter and pagination state
  const {
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
  } = useBookmarkFilters({ bookmarkedEvents, profiles, bookmarkMetadata });
  
  // Collection dialog state
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionColor, setNewCollectionColor] = useState("#3b82f6");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");

  // Handle creating a new collection
  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      toast.error("Collection name is required");
      return;
    }
    
    const collectionId = await createCollection(
      newCollectionName,
      newCollectionColor,
      newCollectionDescription
    );
    
    if (collectionId) {
      // Reset form
      setNewCollectionName("");
      setNewCollectionColor("#3b82f6");
      setNewCollectionDescription("");
      setIsCollectionDialogOpen(false);
      toast.success(`Collection "${newCollectionName}" created`);
    } else {
      toast.error("Failed to create collection");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="border-b pb-3 mb-4">
        <BookmarkHeader 
          viewMode={viewMode}
          setViewMode={setViewMode}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
        
        <BookmarkFilters
          isLoggedIn={isLoggedIn}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCollection={selectedCollection}
          setSelectedCollection={setSelectedCollection}
          collections={collections}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          allTags={allTags}
          handleResetFilters={handleResetFilters}
          handleRemoveTag={handleRemoveTag}
          handleCreateCollection={handleCreateCollection}
          newCollectionName={newCollectionName}
          setNewCollectionName={setNewCollectionName}
          newCollectionColor={newCollectionColor}
          setNewCollectionColor={setNewCollectionColor}
          newCollectionDescription={newCollectionDescription}
          setNewCollectionDescription={setNewCollectionDescription}
          isCollectionDialogOpen={isCollectionDialogOpen}
          setIsCollectionDialogOpen={setIsCollectionDialogOpen}
        />
      </div>
      
      <BookmarksList
        loading={loading}
        isLoggedIn={isLoggedIn}
        paginatedEvents={paginatedEvents}
        bookmarkMetadata={bookmarkMetadata}
        collections={collections}
        profiles={profiles}
        viewMode={viewMode}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        searchTerm={searchTerm}
        selectedCollection={selectedCollection}
        selectedTags={selectedTags}
        handleResetFilters={handleResetFilters}
        filteredAndSortedEvents={filteredAndSortedEvents}
      />
    </div>
  );
};

export default BookmarksPage;
