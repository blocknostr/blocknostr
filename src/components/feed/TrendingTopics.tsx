
import React, { useState } from "react";
import { Hash, SlidersHorizontal, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";
import { useTrendingTopicsData } from "@/components/trending/hooks/useTrendingTopicsData";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import FilterOptionItem from "@/components/trending/FilterOptionItem";
import TimeOptionItem from "@/components/trending/TimeOptionItem";

interface TrendingTopicsProps {
  onTopicClick: (topic: string) => void;
}

const TrendingTopics: React.FC<TrendingTopicsProps> = ({ onTopicClick }) => {
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
          <CardTitle className="text-lg flex items-center gap-2">
            <Hash className="h-4 w-4 text-primary" />
            Trending
          </CardTitle>
          <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 gap-1">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:inline-block">Filters</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm font-semibold">
                Category
              </div>
              {filterOptions.map(option => (
                <FilterOptionItem 
                  key={option.value}
                  isActive={option.value === activeFilter}
                  onClick={() => setActiveFilter(option.value)}
                  icon={option.icon}
                  label={option.label}
                />
              ))}
              
              <DropdownMenuSeparator />
              
              <div className="px-2 py-1.5 text-sm font-semibold">
                Time Range
              </div>
              {timeOptions.map(option => (
                <TimeOptionItem 
                  key={option.value}
                  isActive={option.value === timeRange}
                  onClick={() => setTimeRange(option.value)}
                  label={option.label}
                />
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      {/* Filter badges */}
      <div className="px-4 pb-2 flex flex-wrap items-center gap-2">
        {currentFilter && (
          <Badge variant="outline" className="flex items-center gap-1 bg-background">
            {currentFilter.icon}
            <span>{currentFilter.label}</span>
          </Badge>
        )}
        {currentTime && (
          <Badge variant="outline" className="flex items-center gap-1 bg-background">
            <Clock className="h-3 w-3" />
            <span>{currentTime.label}</span>
          </Badge>
        )}
      </div>
      
      <CardContent className="px-4 pb-3">
        <div className="space-y-3">
          {trendingTopics.length > 0 ? (
            trendingTopics.map((topic) => (
              <div 
                key={topic.name}
                className="hover:bg-accent/50 px-2 py-1.5 rounded-md -mx-2 cursor-pointer transition-colors"
                onClick={() => onTopicClick(topic.name)}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-md">#{topic.name}</div>
                  <div className="text-sm text-muted-foreground">{topic.posts}</div>
                </div>
                <div className="text-xs text-muted-foreground">posts</div>
              </div>
            ))
          ) : (
            <div className="text-center py-2 text-muted-foreground">
              No topics found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendingTopics;
