
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface FeedRefreshButtonProps {
  onRefresh?: () => void;
  loading: boolean;
}

const FeedRefreshButton: React.FC<FeedRefreshButtonProps> = ({ 
  onRefresh, 
  loading 
}) => {
  if (!onRefresh) {
    return null;
  }

  return (
    <div className="flex justify-center mb-4">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onRefresh}
        disabled={loading}
        className="flex items-center gap-2"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Refresh Feed
      </Button>
    </div>
  );
};

export default FeedRefreshButton;
