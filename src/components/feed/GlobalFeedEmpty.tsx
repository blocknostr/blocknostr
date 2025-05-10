
import React from 'react';

interface GlobalFeedEmptyProps {
  activeHashtag?: string;
}

const GlobalFeedEmpty: React.FC<GlobalFeedEmptyProps> = ({ activeHashtag }) => {
  return (
    <div className="py-4 text-center text-muted-foreground">
      No posts found with #{activeHashtag} hashtag
    </div>
  );
};

export default GlobalFeedEmpty;
