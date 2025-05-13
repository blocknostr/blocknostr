
import { useState, useCallback } from "react";

interface UseFeedPaginationProps {
  events: any[];
  initialDisplayCount?: number;
}

export function useFeedPagination({ 
  events, 
  initialDisplayCount = 15 
}: UseFeedPaginationProps) {
  // State to track how many posts to display
  const [visibleCount, setVisibleCount] = useState(initialDisplayCount);
  
  // Handler for "Load More" button click
  const handleLoadMore = useCallback(() => {
    // Show more posts in increments
    setVisibleCount(prev => Math.min(prev + initialDisplayCount, events.length));
  }, [events.length, initialDisplayCount]);

  // Determine if we should show the "Load More" button
  const hasMoreToShow = visibleCount < events.length;
  
  // Get only the events we want to display
  const visibleEvents = events.slice(0, visibleCount);

  return {
    visibleCount,
    visibleEvents,
    hasMoreToShow,
    handleLoadMore
  };
}

export default useFeedPagination;
