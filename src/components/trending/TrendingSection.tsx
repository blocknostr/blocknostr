
import React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import TrendingFilterButton from "./TrendingFilterButton";
import TrendingFilterMenu from "./TrendingFilterMenu";
import TrendingFilters from "./TrendingFilters";
import TrendingTopicsList from "./TrendingTopicsList";
import { useTrendingTopicsData } from "./hooks/useTrendingTopicsData";

interface TrendingSectionProps {
  onTopicClick?: (topic: string) => void;
}

const TrendingSection: React.FC<TrendingSectionProps> = ({ onTopicClick = () => {} }) => {
  const {
    activeFilter,
    setActiveFilter,
    timeRange,
    setTimeRange,
    isFilterOpen,
    setIsFilterOpen,
    filterOptions,
    timeOptions,
    trendingTopics,
    currentFilter,
    currentTime
  } = useTrendingTopicsData();
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Trending</CardTitle>
          
          <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <TrendingFilterButton />
            <TrendingFilterMenu
              filterOptions={filterOptions}
              timeOptions={timeOptions}
              activeFilter={activeFilter}
              timeRange={timeRange}
              setActiveFilter={setActiveFilter}
              setTimeRange={setTimeRange}
            />
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <TrendingFilters 
        currentFilter={currentFilter}
        currentTime={currentTime}
      />
      
      <TrendingTopicsList 
        topics={trendingTopics}
        onTopicClick={onTopicClick}
      />
    </Card>
  );
};

export default TrendingSection;
