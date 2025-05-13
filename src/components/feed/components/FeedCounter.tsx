
import React from "react";

interface FeedCounterProps {
  visibleCount: number;
  eventsLength: number;
}

/**
 * FeedCounter component is now disabled - always returns null
 * This component previously showed "Showing X Blocks" at the top of the feed
 */
const FeedCounter: React.FC<FeedCounterProps> = ({ 
  visibleCount, 
  eventsLength 
}) => {
  // Returning null in all cases to hide the counter
  return null;
};

export default FeedCounter;
