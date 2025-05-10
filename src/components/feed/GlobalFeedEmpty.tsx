
import React from 'react';
import { SearchX } from 'lucide-react';

interface GlobalFeedEmptyProps {
  activeHashtag?: string;
}

const GlobalFeedEmpty: React.FC<GlobalFeedEmptyProps> = ({ activeHashtag }) => {
  return (
    <div className="py-12 text-center text-muted-foreground">
      <div className="flex justify-center mb-4">
        <SearchX className="h-12 w-12 text-muted-foreground/70" />
      </div>
      <h3 className="text-lg font-medium mb-2">No posts found</h3>
      {activeHashtag ? (
        <p>There are no posts with the hashtag <span className="font-medium text-primary">#{activeHashtag}</span> yet.</p>
      ) : (
        <p>Be the first to post something!</p>
      )}
    </div>
  );
};

export default GlobalFeedEmpty;
