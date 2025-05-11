
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
        Loading posts from people you follow...
      </div>
    );
  }

  if (activeHashtag && !loading) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        No posts found with #{activeHashtag} hashtag from people you follow
      </div>
    );
  }

  if (following.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        You're not following anyone yet. Follow some users to see their posts here.
      </div>
    );
  }

  return (
    <div className="py-8 text-center text-muted-foreground">
      No posts from people you follow yet. Try following more users or connecting to more relays.
    </div>
  );
};

export default FeedEmptyState;
