
import React from "react";
import FeedEmptyState from "./FeedEmptyState";
import FeedLoading from "./FeedLoading";
import FeedList from "./FeedList";
import { useMediaFeed } from "./hooks/use-media-feed";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface MediaFeedProps {
  activeHashtag?: string;
}

const MediaFeed: React.FC<MediaFeedProps> = ({ activeHashtag }) => {
  const {
    events,
    profiles,
    repostData,
    loadMoreRef,
    loading,
    hasMore
  } = useMediaFeed({ activeHashtag });

  // Function to refresh the feed
  const handleRefresh = () => {
    // Reload the page to force a complete refresh of the media feed
    window.location.reload();
    toast.info("Refreshing media feed...");
  };

  // Show loading state when no events and loading
  if (loading && events.length === 0) {
    return <FeedLoading activeHashtag={activeHashtag} mediaOnly={true} />;
  }
  
  // Show empty state when no events and not loading
  if (events.length === 0) {
    return (
      <div className="space-y-4">
        <div className="py-4 text-center text-muted-foreground">
          {activeHashtag ? 
            `No media posts found with #${activeHashtag} hashtag` :
            "No media posts found. Connect to more relays to see media here."
          }
        </div>
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  // Show events list
  return (
    <FeedList 
      events={events}
      profiles={profiles}
      repostData={repostData}
      loadMoreRef={loadMoreRef}
      loading={loading}
      onRefresh={handleRefresh}
      hasMore={hasMore}
      onLoadMore={() => {}} // Handled internally by the useMediaFeed hook
    />
  );
};

export default MediaFeed;
