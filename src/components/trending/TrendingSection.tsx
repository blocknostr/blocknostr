
import React from 'react';
import { TrendingFilterMenu } from './TrendingFilterMenu';
import { TrendingTopicsList } from './TrendingTopicsList';
import { TrendingTopicsTimeRange } from './types';
import { useTrendingTopicsData } from './hooks/useTrendingTopicsData';
import { useUserPreferences } from '@/hooks/useUserPreferences';

export interface TrendingSectionProps {
  className?: string;
}

export function TrendingSection({ className = '' }: TrendingSectionProps) {
  const { preferences } = useUserPreferences();
  const [selectedTime, setSelectedTime] = React.useState<TrendingTopicsTimeRange>('24h');
  const { topics, loading, error } = useTrendingTopicsData(selectedTime);

  // Hide trending section if the user preference is set to false
  if (!preferences.uiPreferences.showTrending) {
    return null;
  }

  return (
    <div className={`rounded-lg border bg-card text-card-foreground shadow ${className}`}>
      <div className="p-4 flex flex-col">
        <div className="flex flex-row items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Trending</h3>
          <TrendingFilterMenu
            selectedTime={selectedTime}
            onTimeSelect={setSelectedTime}
          />
        </div>
        <TrendingTopicsList 
          topics={topics}
          loading={loading}
          error={error}
          timeRange={selectedTime}
        />
      </div>
    </div>
  );
}

export default TrendingSection;
