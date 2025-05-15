
import React from 'react';
import { Hash, SlidersHorizontal, Clock } from "lucide-react";
import TrendingTopicsList from './TrendingTopicsList';
import { useTrendingTopicsData } from './hooks/useTrendingTopicsData';
import TrendingFilters from './TrendingFilters';
import { useUserPreferences } from '@/hooks/useUserPreferences';

export interface TrendingSectionProps {
  onTopicClick?: (topic: string) => void;
  activeHashtag?: string;
  onClearHashtag?: () => void;
  className?: string;
}

const TrendingSection: React.FC<TrendingSectionProps> = ({ 
  onTopicClick,
  activeHashtag,
  onClearHashtag,
  className = ''
}) => {
  const { preferences } = useUserPreferences();
  const {
    trendingTopics,
    activeFilter,
    timeRange,
    setActiveFilter,
    setTimeRange,
    isFilterOpen,
    setIsFilterOpen,
    filterOptions,
    timeOptions,
    currentFilter,
    currentTime
  } = useTrendingTopicsData();

  // Hide trending section if user preference is set to false
  if (!preferences.uiPreferences.showTrending) {
    return null;
  }

  return (
    <div className={`bg-background border rounded-lg shadow-sm overflow-hidden ${className}`}>
      <div className="p-3 border-b">
        <h3 className="text-sm font-medium">Trending Topics</h3>
      </div>
      
      <TrendingFilters 
        currentFilter={currentFilter}
        currentTime={currentTime}
      />
      
      <TrendingTopicsList 
        topics={trendingTopics}
        onTopicClick={onTopicClick}
      />
    </div>
  );
};

export default TrendingSection;
