
import React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import TrendingFilters from "./TrendingFilters";
import TrendingTopicsList from "./TrendingTopicsList";
import TrendingFilterButton from "./TrendingFilterButton";
import TrendingFilterMenu from "./TrendingFilterMenu";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { useTrendingTopicsData } from "./hooks/useTrendingTopicsData";
import { Badge } from "@/components/ui/badge";
import { X, Hash } from "lucide-react";

interface TrendingSectionProps {
  onTopicClick?: (topic: string) => void;
  activeHashtag?: string;
  onClearHashtag?: () => void;
}

const TrendingSection: React.FC<TrendingSectionProps> = ({ 
  onTopicClick = () => {},
  activeHashtag,
  onClearHashtag
}) => {
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
  
  // Limit the number of topics to 3 to save space
  const limitedTopics = trendingTopics.slice(0, 3);
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-2 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-1">
            <Hash className="h-3.5 w-3.5 text-primary" />
            Trending
          </CardTitle>
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
      
      {/* Active Hashtag Display */}
      {activeHashtag && (
        <div className="px-3 pb-1">
          <Badge 
            variant="secondary" 
            className="flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/15 text-xs py-0.5"
          >
            <span className="font-medium">#{activeHashtag}</span>
            {onClearHashtag && (
              <button 
                onClick={onClearHashtag} 
                className="rounded-full hover:bg-primary/20 p-0.5 transition-colors"
                title="Clear filter"
              >
                <X size={12} />
              </button>
            )}
          </Badge>
        </div>
      )}
      
      <TrendingFilters 
        currentFilter={currentFilter} 
        currentTime={currentTime}
      />
      
      <TrendingTopicsList 
        topics={limitedTopics}
        onTopicClick={onTopicClick}
      />
    </Card>
  );
};

export default TrendingSection;
