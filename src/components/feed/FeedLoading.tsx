
import React from "react";
import { Loader2 } from "lucide-react";

interface FeedLoadingProps {
  activeHashtag?: string;
  mediaOnly?: boolean;
}

const FeedLoading: React.FC<FeedLoadingProps> = ({ activeHashtag, mediaOnly }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">
        Loading {mediaOnly ? 'media ' : ''}posts{activeHashtag ? ` with #${activeHashtag}` : ''}...
      </p>
      <p className="text-xs text-muted-foreground/70">
        Connecting to relays and fetching content
      </p>
    </div>
  );
};

export default FeedLoading;
