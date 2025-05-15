
import { FC, useState, useEffect } from "react";
import TrendingTopicsList from "./TrendingTopicsList";
import TrendingFilters from "./TrendingFilters";
import { useTrendingTopicsData } from "./hooks/useTrendingTopicsData";
import { FilterType, TimeRange } from "./types";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import TrendingFilterButton from "./TrendingFilterButton";
import TrendingFilterMenu from "./TrendingFilterMenu";

interface TrendingSectionProps {
  onTopicClick?: (topic: string) => void;
  activeHashtag?: string;
  onClearHashtag?: () => void;
}

const TrendingSection: FC<TrendingSectionProps> = ({ 
  onTopicClick,
  activeHashtag,
  onClearHashtag
}) => {
  const {
    activeFilter,
    setActiveFilter,
    timeRange,
    setTimeRange,
    filterOptions,
    timeOptions,
    trendingTopics,
    currentFilter,
    currentTime
  } = useTrendingTopicsData();
  
  // Filter topics based on the selected filter and time range
  const filteredTopics = trendingTopics.filter((topic) => {
    if (activeFilter === "popular") {
      return true;
    }
    
    if (activeFilter === "zapped") {
      return true;
    }
    
    if (activeFilter === "liked") {
      return true;
    }
    
    return true;
  });

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  const handleTimeRangeChange = (timeRange: TimeRange) => {
    setTimeRange(timeRange);
  };

  return (
    <div className="bg-card rounded-md shadow-sm mb-4 overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-medium">Trending</h2>
        <DropdownMenu>
          <TrendingFilterButton />
          <TrendingFilterMenu 
            filterOptions={filterOptions}
            timeOptions={timeOptions}
            activeFilter={activeFilter}
            timeRange={timeRange}
            setActiveFilter={handleFilterChange}
            setTimeRange={handleTimeRangeChange}
          />
        </DropdownMenu>
      </div>
      
      <TrendingFilters
        currentFilter={currentFilter}
        currentTime={currentTime}
      />
      
      <TrendingTopicsList
        topics={filteredTopics}
        onTopicClick={onTopicClick || (() => {})}
        activeHashtag={activeHashtag}
        onClearHashtag={onClearHashtag}
      />
    </div>
  );
};

export default TrendingSection;
