
import React from "react";
import { CardContent } from "@/components/ui/card";
import TrendingTopicItem from "./TrendingTopicItem";
import { Topic } from "./types";

interface TrendingTopicsListProps {
  topics: Topic[];
  onTopicClick?: (topic: string) => void;
  activeHashtag?: string;
  onClearHashtag?: () => void;
}

const TrendingTopicsList: React.FC<TrendingTopicsListProps> = ({ 
  topics, 
  onTopicClick = () => {},
  activeHashtag,
  onClearHashtag
}) => {
  // Limit to only 6 topics
  const displayTopics = topics.slice(0, 6);
  
  return (
    <CardContent className="px-3 py-2">
      {activeHashtag && (
        <div className="mb-2 px-2 py-1 bg-accent rounded-md flex justify-between items-center">
          <div className="text-sm font-medium">#{activeHashtag}</div>
          {onClearHashtag && (
            <button 
              onClick={onClearHashtag}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              Clear
            </button>
          )}
        </div>
      )}
      
      {displayTopics.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-2 gap-y-2">
          {displayTopics.map((topic) => (
            <TrendingTopicItem
              key={topic.name}
              name={topic.name}
              posts={topic.posts}
              onClick={() => onTopicClick(topic.name)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-2 text-muted-foreground">
          No topics found
        </div>
      )}
    </CardContent>
  );
};

export default TrendingTopicsList;

