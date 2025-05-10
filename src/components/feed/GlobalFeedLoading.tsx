
import React from 'react';

interface GlobalFeedLoadingProps {
  activeHashtag?: string;
}

const GlobalFeedLoading: React.FC<GlobalFeedLoadingProps> = ({ activeHashtag }) => {
  return (
    <div className="py-8 text-center text-muted-foreground">
      Loading posts{activeHashtag ? ` with #${activeHashtag}` : ''}...
    </div>
  );
};

export default GlobalFeedLoading;
