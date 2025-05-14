
import React from 'react';
import { TrendingTopicsList } from './TrendingTopicsList';
import { useTrendingTopicsData } from './hooks/useTrendingTopicsData';
import { TrendingFilters } from './TrendingFilters';

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
    topics,
    isLoading,
    selectedTime,
    setSelectedTime,
    selectedFilter,
    setSelectedFilter
  } = useTrendingTopicsData();

  return (
    <div className="bg-background border rounded-lg shadow-sm overflow-hidden">
      <div className="p-3 border-b">
        <h3 className="text-sm font-medium">Trending Topics</h3>
      </div>
      
      <TrendingFilters 
        selectedTime={selectedTime}
        onTimeChange={setSelectedTime}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
      />
      
      <TrendingTopicsList 
        topics={topics}
        isLoading={isLoading}
        onTopicClick={onTopicClick}
        activeHashtag={activeHashtag}
        onClearHashtag={onClearHashtag}
      />
    </div>
  );
};

export default TrendingSection;
