
import React, { useCallback, useState, useEffect } from "react";
import FeedLoading from "./FeedLoading";
import FeedList from "./FeedList";
import { useGlobalFeed } from "./hooks/use-global-feed";
import { Button } from "../ui/button";
import { AlertCircle, RefreshCw, Filter } from "lucide-react";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { FeedCustomizationDialog } from "./FeedCustomizationDialog";

interface GlobalFeedProps {
  activeHashtag?: string;
  onLoadingChange?: (isLoading: boolean) => void;
}

const GlobalFeed: React.FC<GlobalFeedProps> = ({ 
  activeHashtag,
  onLoadingChange
}) => {
  const { preferences } = useUserPreferences();
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  
  const {
    events,
    profiles,
    repostData,
    loadMoreRef,
    loading,
    hasMore,
    loadMoreEvents,
    loadingMore,
    refresh
  } = useGlobalFeed({ 
    activeHashtag,
    // If activeHashtag is set, it overrides the global hashtags
    defaultHashtags: activeHashtag ? [] : preferences.feedFilters.globalHashtags
  });
  
  const [extendedLoading, setExtendedLoading] = useState(true);
  const [showRetry, setShowRetry] = useState(false);
  
  // Notify parent component of loading state changes
  useEffect(() => {
    // Update loading state via callback if provided
    if (onLoadingChange) {
      onLoadingChange(loading || extendedLoading);
    }
    
    // Dispatch custom event for global notification of loading state changes
    // This allows components that don't have direct prop connection to react
    window.dispatchEvent(new CustomEvent('feed-loading-change', { 
      detail: { isLoading: loading || extendedLoading }
    }));
    
  }, [loading, extendedLoading, onLoadingChange]);
  
  // Reset extended loading state when activeHashtag changes
  useEffect(() => {
    setExtendedLoading(true);
    setShowRetry(false);
    
    // Set a longer timeout for showing retry button
    const timeout = setTimeout(() => {
      setExtendedLoading(false);
      if (events.length === 0 && !loading) {
        setShowRetry(true);
      }
    }, 7000); // 7 seconds timeout before showing retry
    
    return () => clearTimeout(timeout);
  }, [activeHashtag, loading]);
  
  // Update showRetry when events or loading state changes
  useEffect(() => {
    if (!extendedLoading && events.length === 0 && !loading) {
      setShowRetry(true);
    } else if (events.length > 0 || loading) {
      setShowRetry(false);
    }
  }, [events, loading, extendedLoading]);
  
  const handleRetry = () => {
    setExtendedLoading(true);
    setShowRetry(false);
    
    // Refresh the feed
    refresh();
    
    // Set timeout to show retry again if still no events after 7 seconds
    setTimeout(() => {
      setExtendedLoading(false);
    }, 7000);
  };

  // Show loading state when no events and loading or in extended loading period
  if ((loading || extendedLoading) && events.length === 0) {
    return <FeedLoading activeHashtag={activeHashtag} />;
  }
  
  // Show retry button when no events and not loading, after extended loading period
  if (events.length === 0 && showRetry) {
    return (
      <div className="py-8 text-center flex flex-col items-center">
        <div className="mb-3">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
        </div>
        <p className="text-muted-foreground mb-4">
          {activeHashtag ? 
            `No posts found with #${activeHashtag} hashtag` :
            preferences.feedFilters.globalHashtags.length > 0 ?
              `No posts found with hashtags: ${preferences.feedFilters.globalHashtags.map(t => `#${t}`).join(", ")}` :
              "No posts found. Connect to more relays to see posts here."
          }
        </p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRetry}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCustomizeOpen(true)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Customize Filters
          </Button>
        </div>
      </div>
    );
  }
  
  // Show empty state when no events and not loading
  if (events.length === 0) {
    return (
      <div className="py-8 text-center flex flex-col items-center">
        <p className="text-muted-foreground mb-4">
          {activeHashtag ? 
            `No posts found with #${activeHashtag} hashtag` :
            preferences.feedFilters.globalHashtags.length > 0 ?
              `No posts found with hashtags: ${preferences.feedFilters.globalHashtags.map(t => `#${t}`).join(", ")}` :
              "No posts found. Connect to more relays to see posts here."
          }
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCustomizeOpen(true)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Customize Filters
        </Button>
        
        <FeedCustomizationDialog
          open={isCustomizeOpen}
          onOpenChange={setIsCustomizeOpen}
        />
      </div>
    );
  }

  // Show events list
  return (
    <>
      <FeedList 
        events={events}
        profiles={profiles}
        repostData={repostData}
        loadMoreRef={loadMoreRef}
        loading={loading}
        onRefresh={refresh}
        onLoadMore={loadMoreEvents}
        hasMore={hasMore}
        loadMoreLoading={loadingMore}
      />
      
      <FeedCustomizationDialog
        open={isCustomizeOpen}
        onOpenChange={setIsCustomizeOpen}
      />
    </>
  );
};

export default GlobalFeed;
