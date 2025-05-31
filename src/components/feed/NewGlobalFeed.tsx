import React, { useState, useEffect } from "react";
import { useFeedRTK } from "@/hooks/api/useFeedRTK";
import VirtualizedFeed from "./VirtualizedFeed";
import { Loader2, AlertCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "../ui/button";
import { useBackgroundRelayConnection } from "@/hooks/useBackgroundRelayConnection";

interface NewGlobalFeedProps {
  activeHashtag?: string;
  onLoadingChange?: (isLoading: boolean) => void;
}

const NewGlobalFeed: React.FC<NewGlobalFeedProps> = ({ 
  activeHashtag,
  onLoadingChange 
}) => {
  const [feedHeight, setFeedHeight] = useState(600);
  const relayState = useBackgroundRelayConnection();

  // Use the simplified RTK Query-based feed hook
  const {
    events,
    profiles,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMoreEvents,
    refreshEvents
  } = useFeedRTK({
    feedType: 'global',
    activeHashtag,
    onLoadingChange
  });

  // Calculate dynamic height for virtualized feed
  const calculateFeedHeight = () => {
    const viewportHeight = window.innerHeight;
    const headerHeight = 56;
    const searchSectionHeight = 60;
    const cryptoSectionHeight = 160;
    const sidebarSpacing = 24;
    const contentPadding = 32;
    
    const sidebarAvailableHeight = viewportHeight - headerHeight;
    const worldChatHeight = sidebarAvailableHeight - searchSectionHeight - cryptoSectionHeight - sidebarSpacing;
    const feedHeight = worldChatHeight - contentPadding;
    
    return Math.max(400, Math.min(feedHeight, viewportHeight - headerHeight - contentPadding - 100));
  };

  // Update feed height on mount and window resize
  useEffect(() => {
    const updateFeedHeight = () => {
      setFeedHeight(calculateFeedHeight());
    };

    updateFeedHeight();
    window.addEventListener('resize', updateFeedHeight);

    return () => {
      window.removeEventListener('resize', updateFeedHeight);
    };
  }, []);

  // Show loading state for initial load
  if (loading && events.length === 0) {
    return (
      <div className="py-8 flex justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">
            {activeHashtag ? `Loading #${activeHashtag} posts...` : "Loading global feed..."}
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && events.length === 0) {
    return (
      <div className="py-8 text-center">
        <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
        <p className="text-muted-foreground mb-2">{error}</p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={refreshEvents}
          className="mx-auto"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  // Show empty state with relay status
  if (events.length === 0 && !loading) {
    return (
      <div className="py-12 text-center">
        <div className="flex flex-col items-center">
          {relayState.isConnecting ? (
            <>
              <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium mb-2">Connecting to relays...</h3>
              <p className="text-muted-foreground">
                Setting up connections to fetch the latest posts
              </p>
            </>
          ) : relayState.error ? (
            <>
              <WifiOff className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Connection Error</h3>
              <p className="text-muted-foreground mb-4">
                Unable to connect to Nostr relays
              </p>
              <Button onClick={relayState.reconnect} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Connection
              </Button>
            </>
          ) : (
            <>
              <Wifi className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {activeHashtag ? `No posts found for #${activeHashtag}` : "No posts found"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {activeHashtag 
                  ? `Try a different hashtag or check back later`
                  : "The global feed appears to be empty. Try refreshing or check back later."
                }
              </p>
              <Button onClick={refreshEvents} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Feed
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Render the virtualized feed
  return (
    <div className="relative">
      
      <VirtualizedFeed
        events={events}
        profiles={profiles}
        height={feedHeight}
        onLoadMore={loadMoreEvents}
        hasMore={hasMore}
        loadingMore={loadingMore}
      />
      
      {/* Connection status indicator */}
      {relayState.error && events.length > 0 && (
        <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-md p-2 border border-destructive/20">
          <div className="flex items-center gap-2 text-xs text-destructive">
            <WifiOff className="h-3 w-3" />
            <span>Connection issues</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewGlobalFeed;

