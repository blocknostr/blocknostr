
import React from "react";

interface FeedLoadingProps {
  activeHashtag?: string;
}

const FeedLoading: React.FC<FeedLoadingProps> = ({ activeHashtag }) => {
  return (
    <div className="py-8 text-center text-muted-foreground">
      Loading posts{activeHashtag ? ` with #${activeHashtag}` : ''} from people you follow...
    </div>
  );
};

export default FeedLoading;
