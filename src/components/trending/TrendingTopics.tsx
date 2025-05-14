
import React, { useEffect, useState } from "react";
import { Trending, TrendingTimeOption, TrendingFilterOption } from "./types";
import { cn } from "@/lib/utils";
import { cacheManager } from "@/lib/utils/cacheManager";
import { TrendingTopicItem } from "./TrendingTopicItem";
import { useTrendingTopicsData } from "./hooks/useTrendingTopicsData";
import { TrendingFilters } from "./TrendingFilters";

interface TrendingTopicsProps {
  onHashtagClick?: (hashtag: string) => void;
  className?: string;
  compact?: boolean;
  showFilters?: boolean;
}

export function TrendingTopics({ 
  onHashtagClick, 
  className,
  compact = false,
  showFilters = true
}: TrendingTopicsProps) {
  const [selectedTimeOption, setSelectedTimeOption] = 
    useState<TrendingTimeOption>("24h");
  const [selectedFilter, setSelectedFilter] = 
    useState<TrendingFilterOption>("popular");

  const { 
    trendingTopics, 
    isLoading, 
    error 
  } = useTrendingTopicsData(selectedTimeOption, selectedFilter);

  // Cache the selected options
  useEffect(() => {
    cacheManager.set("trending_time_option", selectedTimeOption);
    cacheManager.set("trending_filter_option", selectedFilter);
  }, [selectedTimeOption, selectedFilter]);

  // Load cached options on mount
  useEffect(() => {
    const cachedTimeOption = cacheManager.get<TrendingTimeOption>("trending_time_option");
    const cachedFilterOption = cacheManager.get<TrendingFilterOption>("trending_filter_option");
    
    if (cachedTimeOption) {
      setSelectedTimeOption(cachedTimeOption);
    }
    
    if (cachedFilterOption) {
      setSelectedFilter(cachedFilterOption);
    }
  }, []);

  // Display loading state
  if (isLoading) {
    return (
      <div className={cn(
        "rounded-md border bg-card text-card-foreground shadow-sm", 
        className
      )}>
        <div className="p-4">
          <h3 className="font-semibold mb-2">Trending Topics</h3>
          <div className="space-y-2">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-6 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Display error state
  if (error || !trendingTopics.length) {
    return (
      <div className={cn(
        "rounded-md border bg-card text-card-foreground shadow-sm", 
        className
      )}>
        <div className="p-4">
          <h3 className="font-semibold mb-2">Trending Topics</h3>
          <p className="text-sm text-muted-foreground">
            No trending topics available right now.
          </p>
        </div>
      </div>
    );
  }

  // Display trending topics
  return (
    <div className={cn(
      "rounded-md border bg-card text-card-foreground shadow-sm", 
      className
    )}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">Trending Topics</h3>
          
          {showFilters && (
            <TrendingFilters 
              selectedTimeOption={selectedTimeOption}
              selectedFilterOption={selectedFilter}
              onTimeOptionChange={setSelectedTimeOption}
              onFilterOptionChange={setSelectedFilter}
            />
          )}
        </div>
        
        <div className={cn(
          "grid gap-2",
          compact ? "grid-cols-2" : "grid-cols-1"
        )}>
          {trendingTopics.slice(0, compact ? 6 : 10).map((topic) => (
            <TrendingTopicItem 
              key={topic.tag} 
              topic={topic} 
              onHashtagClick={onHashtagClick} 
              compact={compact}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
