
import React from "react";

interface FeedLoadingProps {
  activeHashtag?: string;
  mediaOnly?: boolean;
}

const FeedLoading: React.FC<FeedLoadingProps> = ({ activeHashtag, mediaOnly }) => {
  return (
    <div className="py-8 text-center text-muted-foreground">
      Loading {mediaOnly ? 'media ' : ''}posts{activeHashtag ? ` with #${activeHashtag}` : ''}...
    </div>
  );
};

export default FeedLoading;
