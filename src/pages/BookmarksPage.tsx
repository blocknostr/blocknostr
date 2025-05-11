
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBookmarkData } from "@/hooks/bookmarks/useBookmarkData";
import { useBookmarkFilters, SortOption } from "@/hooks/bookmarks/useBookmarkFilters";
import { useBookmarkSwipe } from "@/hooks/bookmarks/useBookmarkSwipe";
import { useUserPreferences } from "@/hooks/useUserPreferences";

import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/navigation/PageHeader";
import { BookmarkFilters } from "@/components/bookmark/BookmarkFilters";
import { BookmarksList } from "@/components/bookmark/BookmarksList";
import MobileMenu from "@/components/home/MobileMenu";
import { BookmarkHeader } from "@/components/bookmark/BookmarkHeader";
import { BookmarkCollectionDialog } from "@/components/bookmark/BookmarkCollectionDialog";
import BookmarkSyncManager from "@/components/bookmark/BookmarkSyncManager";

export function BookmarksPage() {
  const { preferences } = useUserPreferences();
  const isMobile = useIsMobile();
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);

  // Fetch bookmark data with enhanced robustness
  const {
    bookmarkedEvents,
    bookmarkMetadata,
    collections,
    profiles,
    loading,
    error,
    isLoggedIn,
    allTags,
    networkStatus,
    createCollection,
    refreshBookmarks
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
  } = useBookmarkFilters({ 
    events: bookmarkedEvents || [], 
    collections, 
    metadata: bookmarkMetadata 
  });
  
  // Collection dialog state
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionColor, setNewCollectionColor] = useState("#3b82f6");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");

  // Handle swipe gestures
  const { swipeHandlers, handleMainContentClick } = useBookmarkSwipe({
    isMobile,
    leftPanelOpen,
    setLeftPanelOpen,
    rightPanelOpen,
    setRightPanelOpen
  });

  // Header right content with bookmarks controls
  const bookmarksHeaderControls = (
    <BookmarkHeader 
      viewMode={viewMode}
      setViewMode={setViewMode}
      sortBy={sortBy}
      setSortBy={setSortBy as (sort: SortOption) => void}
      isOnline={networkStatus === 'online'}
      refreshBookmarks={refreshBookmarks}
      isLoading={loading}
    />
  );

  return (
    <>
      {/* Include the sync manager for processing pending operations */}
      <BookmarkSyncManager />
      
      <div 
        className={`flex min-h-screen bg-background relative ${
          preferences.uiPreferences.compactMode ? "text-sm" : ""
        }`}
        {...swipeHandlers}
      >
        {/* Desktop sidebar - only visible on non-mobile */}
        {!isMobile && <Sidebar />}
        
        <div 
          className={`flex-1 transition-all duration-200 ${!isMobile && "ml-64"}`}
          onClick={handleMainContentClick}
        >
          <PageHeader
            title="Bookmarks"
            rightContent={bookmarksHeaderControls}
            showBackButton={true}
          >
            {isMobile && (
              <MobileMenu
                leftPanelOpen={leftPanelOpen}
                setLeftPanelOpen={setLeftPanelOpen}
                rightPanelOpen={rightPanelOpen}
                setRightPanelOpen={setRightPanelOpen}
              />
            )}
          </PageHeader>
          
          <div className="max-w-5xl mx-auto px-4 pt-4">
            <div className="border-b pb-3 mb-4">
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
                setIsCollectionDialogOpen={setIsCollectionDialogOpen}
                networkStatus={networkStatus}
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
              error={error}
              networkStatus={networkStatus}
              refreshBookmarks={refreshBookmarks}
            />
          </div>

          <BookmarkCollectionDialog
            isOpen={isCollectionDialogOpen}
            setIsOpen={setIsCollectionDialogOpen}
            name={newCollectionName}
            setName={setNewCollectionName}
            color={newCollectionColor}
            setColor={setNewCollectionColor}
            description={newCollectionDescription}
            setDescription={setNewCollectionDescription}
            onCreateCollection={createCollection}
          />
        </div>
      </div>
    </>
  );
}

export default BookmarksPage;
