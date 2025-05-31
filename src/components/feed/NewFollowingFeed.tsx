import React from "react";
import { useFeedRTK } from "@/hooks/api/useFeedRTK";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import NewNoteCard from "../note/NewNoteCard";
import { Loader2, AlertCircle, RefreshCw, UserPlus } from "lucide-react";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";

interface NewFollowingFeedProps {
  activeHashtag?: string;
  onLoadingChange?: (isLoading: boolean) => void;
}

const NewFollowingFeed: React.FC<NewFollowingFeedProps> = ({ 
  activeHashtag,
  onLoadingChange 
}) => {
  // Use the simplified RTK Query-based feed hook
  const {
    events,
    profiles,
    loading,
    loadingMore,
    hasMore,
    error,
    refreshEvents,
    loadMoreEvents
  } = useFeedRTK({
    feedType: 'following',
    activeHashtag,
    onLoadingChange
  });

  // Set up intersection observer for infinite scroll
  const { observedRef } = useIntersectionObserver({
    onIntersect: () => {
      if (loading || loadingMore || !hasMore) return;
      loadMoreEvents();
    },
    rootMargin: '300px',
    enabled: !loading && !loadingMore && hasMore
  });

  // Show loading state
  if (loading && events.length === 0) {
    return (
      <div className="py-8 flex justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">
            Loading posts from people you follow...
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

  // Show empty state when no events
  if (events.length === 0) {
    return (
      <div className="py-12 text-center">
        <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No posts from people you follow</h3>
        <p className="text-muted-foreground mb-4">
          {activeHashtag ? 
            `No posts with #${activeHashtag} from people you follow` :
            "Start following people to see their posts here"
          }
        </p>
        <Button asChild variant="outline">
          <Link to="/discover">Find People to Follow</Link>
        </Button>
      </div>
    );
  }

  // Render events
  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <NewNoteCard
          key={event.id}
          event={event}
          profileData={profiles[event.pubkey]}
        />
      ))}
      
      {/* Infinite scroll trigger */}
      {hasMore && (
        <div 
          ref={observedRef} 
          className="py-4 text-center"
        >
          {loadingMore ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
              <span className="text-muted-foreground">Loading more posts...</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">
              Scroll to load more
            </span>
          )}
        </div>
      )}
      
      {/* End of feed indicator */}
      {!hasMore && events.length > 0 && (
        <div className="py-4 text-center">
          <span className="text-xs text-muted-foreground">
            You've reached the end
          </span>
        </div>
      )}
    </div>
  );
};

export default NewFollowingFeed;

