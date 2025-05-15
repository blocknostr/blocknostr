
import React, { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import TrendingTopicsList from "./TrendingTopicsList";
import TrendingFilters from "./TrendingFilters";
import { FilterType, TimeRange, Topic } from "./types";
import { useTrendingTopicsData } from "./hooks/useTrendingTopicsData";
import { Badge } from "../ui/badge";
import { X } from "lucide-react";

interface TrendingSectionProps {
  onTopicClick?: (topic: string) => void;
  activeHashtag?: string;
  onClearHashtag?: () => void;
}

const TrendingSection: React.FC<TrendingSectionProps> = ({
  onTopicClick,
  activeHashtag,
  onClearHashtag
}) => {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("popular");
  const [selectedTime, setSelectedTime] = useState<TimeRange>("all");
  
  const { trendingTopics, isLoading } = useTrendingTopicsData({
    filter: selectedFilter,
    timeRange: selectedTime
  });
  
  return (
    <Card className="w-full bg-background">
      <CardHeader className="px-3 pb-0 pt-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-semibold flex items-center gap-1.5">
            Trending
            {activeHashtag && (
              <Badge 
                variant="secondary" 
                className="ml-2 gap-1 font-normal text-xs"
              >
                #{activeHashtag}
                {onClearHashtag && (
                  <button 
                    onClick={onClearHashtag}
                    className="text-muted-foreground hover:text-foreground inline-flex p-0"
                    aria-label="Clear hashtag filter"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </Badge>
            )}
          </CardTitle>
          <TrendingFilters 
            selectedFilter={selectedFilter}
            setSelectedFilter={setSelectedFilter}
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
          />
        </div>
      </CardHeader>
      <TrendingTopicsList 
        topics={trendingTopics} 
        onTopicClick={onTopicClick}
        activeHashtag={activeHashtag}
        onClearHashtag={onClearHashtag}
      />
    </Card>
  );
};

export default TrendingSection;
