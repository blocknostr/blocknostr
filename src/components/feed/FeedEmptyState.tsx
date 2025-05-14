
import React from "react";

interface FeedEmptyStateProps {
  following: string[];
  loading: boolean;
  activeHashtag?: string;
}

const FeedEmptyState: React.FC<FeedEmptyStateProps> = ({
  following,
  loading,
  activeHashtag
}) => {
  if (loading && !activeHashtag) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Loading posts...
      </div>
    );
  }

  if (activeHashtag && !loading) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        No posts found with #{activeHashtag}
      </div>
    );
  }

  // Show this only if not following anyone yet
  if (following.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Follow some users to see their posts here
      </div>
    );
  }

  // Return empty div instead of "no posts" message
  return null;
};

export default FeedEmptyState;
