
import React from "react";

interface TrendingTopicItemProps {
  name: string;
  posts: string;
  onClick: () => void;
}

const TrendingTopicItem: React.FC<TrendingTopicItemProps> = ({ name, posts, onClick }) => {
  return (
    <div 
      className="hover:bg-accent/50 px-2 py-1.5 rounded-md -mx-2 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="font-medium text-md">#{name}</div>
        <div className="text-sm text-muted-foreground">{posts}</div>
      </div>
      <div className="text-xs text-muted-foreground">posts</div>
    </div>
  );
};

export default TrendingTopicItem;
