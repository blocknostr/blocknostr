
import React from "react";
import { Loader2, HandStop } from "lucide-react";

interface FeedLoadingIndicatorProps {
  loading: boolean;
  hasMore: boolean;
  inView: boolean;
  isPaused?: boolean;
}

const FeedLoadingIndicator = ({ 
  loading,
  hasMore,
  inView,
  isPaused = false
}: FeedLoadingIndicatorProps) => {
  if (!hasMore || !inView) return null;
  
  if (isPaused) {
    return (
      <div className="py-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-md text-sm">
          <HandStop className="h-3.5 w-3.5" />
          <span>Auto-loading paused</span>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 text-center">
      {loading ? (
        <div className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary/70" />
          <span className="text-muted-foreground text-sm">Loading more posts...</span>
        </div>
      ) : (
        <span className="text-muted-foreground text-xs">Scroll down for more</span>
      )}
    </div>
  );
};

export default FeedLoadingIndicator;
