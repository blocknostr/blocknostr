
import React from "react";

interface FeedCounterProps {
  visibleCount: number;
  eventsLength: number;
}

const FeedCounter: React.FC<FeedCounterProps> = ({ 
  visibleCount, 
  eventsLength 
}) => {
  if (eventsLength === 0) {
    return null;
  }

  return (
    <div className="text-sm text-muted-foreground text-center mb-2">
      Showing {visibleCount} Blocks
    </div>
  );
};

export default FeedCounter;
