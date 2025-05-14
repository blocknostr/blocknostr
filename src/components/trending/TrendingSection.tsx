
import React from 'react';
import { TrendingTopics } from './TrendingTopics';
import { cacheManager } from '@/lib/utils/cacheManager';

interface TrendingSectionProps {
  onHashtagClick?: (hashtag: string) => void;
  className?: string;
}

const TrendingSection: React.FC<TrendingSectionProps> = ({ 
  onHashtagClick,
  className 
}) => {
  return (
    <div className={className}>
      <TrendingTopics 
        onHashtagClick={onHashtagClick} 
        compact={true}
        showFilters={true}
      />
    </div>
  );
};

export default TrendingSection;
