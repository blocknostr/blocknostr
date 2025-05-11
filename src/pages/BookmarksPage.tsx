
import { useState } from "react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBookmarkData } from "@/hooks/bookmarks/useBookmarkData";
import { useBookmarkFilters } from "@/hooks/bookmarks/useBookmarkFilters";
import { useSwipeable } from "@/hooks/use-swipeable";
import { cn } from "@/lib/utils";

import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/navigation/PageHeader";
import BookmarkFilters from "@/components/bookmarks/BookmarkFilters";
import BookmarksList from "@/components/bookmarks/BookmarksList";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import MobileMenu from "@/components/home/MobileMenu";
import BookmarkHeader from "@/components/bookmarks/BookmarkHeader";

const BookmarksPage = () => {
  const { preferences } = useUserPreferences();
  const isMobile = useIsMobile();
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

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

  // Setup swipe handlers for mobile gesture navigation
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (isMobile && !rightPanelOpen) {
        setRightPanelOpen(true);
        setLeftPanelOpen(false);
      }
    },
    onSwipedRight: () => {
      if (isMobile && !leftPanelOpen) {
        setLeftPanelOpen(true);
        setRightPanelOpen(false);
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: false
  });

  // Close panels when clicking on main content (mobile only)
  const handleMainContentClick = () => {
    if (isMobile) {
      setLeftPanelOpen(false);
      setRightPanelOpen(false);
    }
  };

  // Header right content with bookmarks controls
  const bookmarksHeaderControls = (
    <div className="flex items-center gap-2">
      <BookmarkHeader 
        viewMode={viewMode}
        setViewMode={setViewMode}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />
    </div>
  );

  return (
    <div className={cn(
      "flex min-h-screen bg-background relative",
      preferences.uiPreferences.compactMode ? "text-sm" : ""
    )}>
      {/* Desktop sidebar - only visible on non-mobile */}
      {!isMobile && <Sidebar />}
      
      <div 
        className={cn(
          "flex-1 transition-all duration-200",
          !isMobile && "ml-64"
        )}
        {...swipeHandlers}
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
      </div>
    </div>
  );
};

export default BookmarksPage;
