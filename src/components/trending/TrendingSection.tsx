
import { FC, useState, useEffect } from "react";
import TrendingTopicsList from "./TrendingTopicsList";
import TrendingFilters from "./TrendingFilters";
import { useTrendingTopicsData } from "./hooks/useTrendingTopicsData";
import { FilterType, TimeRange } from "./types";

const TrendingSection: FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [activeTimeRange, setActiveTimeRange] = useState<TimeRange>("day");
  
  const {
    trendingTopics,
    isLoading,
    error,
    fetchTrendingTopics,
  } = useTrendingTopicsData();

  useEffect(() => {
    // Initial data fetch
    fetchTrendingTopics();
    
    // Set up periodic refresh (every 5 minutes)
    const intervalId = setInterval(() => {
      fetchTrendingTopics();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [fetchTrendingTopics]);

  // Filter topics based on the selected filter and time range
  const filteredTopics = trendingTopics.filter((topic) => {
    if (activeFilter === "all") {
      return true;
    }
    
    if (activeFilter === "hashtags") {
      return topic.isHashtag;
    }
    
    if (activeFilter === "topics") {
      return !topic.isHashtag;
    }
    
    return true;
  });

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  const handleTimeRangeChange = (timeRange: TimeRange) => {
    setActiveTimeRange(timeRange);
    // Reload data with new time range
    fetchTrendingTopics();
  };

  return (
    <div className="bg-card rounded-md shadow-sm mb-4 overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-medium">Trending</h2>
      </div>
      
      <TrendingFilters
        activeFilter={activeFilter}
        activeTimeRange={activeTimeRange}
        onFilterChange={handleFilterChange}
        onTimeRangeChange={handleTimeRangeChange}
      />
      
      <TrendingTopicsList
        topics={filteredTopics}
        isLoading={isLoading}
        error={error}
      />
      
      <div className="p-3 text-center border-t">
        <button
          onClick={() => {
            setActiveFilter("all");
            setActiveTimeRange("day");
            fetchTrendingTopics();
          }}
          className="text-sm text-primary hover:underline"
        >
          View all trending topics
        </button>
      </div>
    </div>
  );
};

export default TrendingSection;
