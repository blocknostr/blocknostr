
import React from 'react';
import TrendingTopicsList from './TrendingTopicsList';
import { useTrendingTopicsData } from './hooks/useTrendingTopicsData';
import TrendingFilters from './TrendingFilters';

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

  return (
    <div className="bg-background border rounded-lg shadow-sm overflow-hidden">
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
