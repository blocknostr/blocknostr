
import React from 'react';
import { Loader2 } from 'lucide-react';

interface GlobalFeedLoadingProps {
  activeHashtag?: string;
}

const GlobalFeedLoading: React.FC<GlobalFeedLoadingProps> = ({ activeHashtag }) => {
  return (
    <div className="py-12 text-center text-muted-foreground">
      <div className="flex justify-center mb-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
      </div>
      <p className="text-base">
        Loading posts{activeHashtag ? ` with #${activeHashtag}` : ''}...
      </p>
    </div>
  );
};

export default GlobalFeedLoading;
