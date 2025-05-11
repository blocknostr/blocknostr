
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBookmarkData } from "@/hooks/bookmarks/useBookmarkData";
import { useBookmarkFilters, SortOption } from "@/hooks/bookmarks/useBookmarkFilters";
import { useSwipeable } from "@/hooks/use-swipeable";
import { cn } from "@/lib/utils";

import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/navigation/PageHeader";
import BookmarkFilters from "@/components/bookmarks/BookmarkFilters";
import BookmarksList from "@/components/bookmarks/BookmarksList";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import MobileMenu from "@/components/home/MobileMenu";
import BookmarkHeader from "@/components/bookmarks/BookmarkHeader";
import BookmarksPageLayout from "@/components/bookmarks/BookmarksPageLayout";
import BookmarkCollectionDialog from "@/components/bookmarks/BookmarkCollectionDialog";
import { useBookmarkSwipe } from "@/hooks/bookmarks/useBookmarkSwipe";
import BookmarkSyncManager from "@/components/bookmark/BookmarkSyncManager";

const BookmarksPage = () => {
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
  } = useBookmarkFilters({ bookmarkedEvents, profiles, bookmarkMetadata });
  
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
  
  // Monitor network connectivity
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Header right content with bookmarks controls
  const bookmarksHeaderControls = (
    <BookmarkHeader 
      viewMode={viewMode}
      setViewMode={setViewMode}
      sortBy={sortBy}
      setSortBy={setSortBy}
      isOnline={isOnline}
      refreshBookmarks={refreshBookmarks}
      isLoading={loading}
    />
  );

  return (
    <>
      {/* Include the sync manager for processing pending operations */}
      <BookmarkSyncManager />
      
      <BookmarksPageLayout
        preferences={preferences}
        isMobile={isMobile}
        swipeHandlers={swipeHandlers}
        handleMainContentClick={handleMainContentClick}
      >
        {/* Desktop sidebar - only visible on non-mobile */}
        {!isMobile && <Sidebar />}
        
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
        
        <div className="max-w-5xl mx-auto px-4 pt-4" onClick={handleMainContentClick}>
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
      </BookmarksPageLayout>
    </>
  );
};

export default BookmarksPage;
