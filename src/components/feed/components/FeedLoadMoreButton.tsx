
import React from "react";
import { Button } from "@/components/ui/button";

interface FeedLoadMoreButtonProps {
  onClick: () => void;
  visible: boolean;
}

const FeedLoadMoreButton: React.FC<FeedLoadMoreButtonProps> = ({ 
  onClick, 
  visible 
}) => {
  if (!visible) {
    return null;
  }

  return (
    <div className="flex justify-center py-4">
      <Button
        variant="outline"
        onClick={onClick}
        className="px-8 py-2"
      >
        Load More
      </Button>
    </div>
  );
};

export default FeedLoadMoreButton;
