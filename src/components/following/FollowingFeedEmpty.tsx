
import React from 'react';

interface FollowingFeedEmptyProps {
  activeHashtag?: string;
  hasFollowing: boolean;
}

const FollowingFeedEmpty: React.FC<FollowingFeedEmptyProps> = ({ activeHashtag, hasFollowing }) => {
  if (activeHashtag) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        No posts found with #{activeHashtag} hashtag from people you follow
      </div>
    );
  }
  
  return (
    <div className="py-8 text-center text-muted-foreground">
      {hasFollowing 
        ? "No posts from people you follow yet. Try following more users or connecting to more relays."
        : "You're not following anyone yet. Follow some users to see their posts here."}
    </div>
  );
};

export default FollowingFeedEmpty;
