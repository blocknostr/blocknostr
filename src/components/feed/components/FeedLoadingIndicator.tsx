
import React from "react";
import { Loader2 } from "lucide-react";

interface FeedLoadingIndicatorProps {
  loading: boolean;
  hasMore: boolean;
  inView: boolean;
}

const FeedLoadingIndicator: React.FC<FeedLoadingIndicatorProps> = ({ 
  loading, 
  hasMore, 
  inView 
}) => {
  if (!hasMore || !inView) {
    return null;
  }

  return (
    <div className="py-4 text-center">
      {loading && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading more posts...
        </div>
      )}
    </div>
  );
};

export default FeedLoadingIndicator;
