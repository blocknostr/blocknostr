
import React from 'react';

interface FollowingFeedLoadingProps {
  activeHashtag?: string;
  isInitialLoad: boolean;
}

const FollowingFeedLoading: React.FC<FollowingFeedLoadingProps> = ({ activeHashtag, isInitialLoad }) => {
  if (isInitialLoad) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Loading posts{activeHashtag ? ` with #${activeHashtag}` : ''} from people you follow...
      </div>
    );
  }
  
  return (
    <div className="text-muted-foreground text-sm text-center py-4">
      Loading more posts...
    </div>
  );
};

export default FollowingFeedLoading;
