
import React from "react";

interface TrendingTopicItemProps {
  name: string;
  posts: string;
  onClick: () => void;
}

const TrendingTopicItem: React.FC<TrendingTopicItemProps> = ({ name, posts, onClick }) => {
  return (
    <div 
      className="hover:bg-accent/50 px-2 py-1 rounded-md cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="font-medium text-sm truncate">#{name}</div>
        <div className="text-xs text-muted-foreground whitespace-nowrap">{posts}</div>
      </div>
    </div>
  );
};

export default TrendingTopicItem;
