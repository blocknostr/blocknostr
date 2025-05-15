
import React from "react";

interface TrendingTopicItemProps {
  tag: string;
  count: number;
  onClick: () => void;
}

const TrendingTopicItem: React.FC<TrendingTopicItemProps> = ({ tag, count, onClick }) => {
  return (
    <div 
      className="bg-muted/50 hover:bg-muted px-2 py-1.5 rounded-md cursor-pointer text-sm"
      onClick={onClick}
    >
      <div className="font-medium text-foreground/90">#{tag}</div>
      <div className="text-xs text-muted-foreground">{count.toLocaleString()} posts</div>
    </div>
  );
};

export default TrendingTopicItem;
