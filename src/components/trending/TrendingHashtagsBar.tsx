
import React from 'react';
import { useTrendingTopicsData } from './hooks/useTrendingTopicsData';
import { useNavigate } from "react-router-dom";
import { Hash } from "lucide-react";

interface TrendingHashtagsBarProps {
  onTopicClick?: (topic: string) => void;
  activeHashtag?: string;
  className?: string;
}

const TrendingHashtagsBar: React.FC<TrendingHashtagsBarProps> = ({ 
  onTopicClick,
  activeHashtag,
  className = ''
}) => {
  const navigate = useNavigate();
  const { trendingTopics } = useTrendingTopicsData();

  // Only show top 6 trending hashtags in the horizontal bar
  const displayedTopics = trendingTopics.slice(0, 6);

  const handleTopicClick = (topic: string) => {
    if (onTopicClick) {
      onTopicClick(topic);
    }
  };

  if (displayedTopics.length === 0) {
    return null;
  }

  return (
    <div className={`overflow-x-auto scrollbar-hide ${className}`}>
      <div className="flex gap-2 py-2 px-1 min-w-max">
        {displayedTopics.map(topic => {
          const isActive = activeHashtag === topic.tag;
          return (
            <button
              key={topic.tag}
              onClick={() => handleTopicClick(topic.tag)}
              className={`
                flex items-center px-3 py-1 rounded-full text-sm whitespace-nowrap
                ${isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-muted/50 hover:bg-muted text-foreground/80'}
                transition-colors
              `}
            >
              <Hash className="h-3.5 w-3.5 mr-1 opacity-70" />
              {topic.tag}
              {topic.count > 0 && (
                <span className="ml-1.5 text-xs opacity-70">
                  {topic.count < 1000 ? topic.count : `${(topic.count / 1000).toFixed(1)}k`}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TrendingHashtagsBar;
