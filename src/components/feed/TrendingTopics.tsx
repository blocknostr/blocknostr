
import React from "react";
import { TrendingSection } from "@/components/trending";

interface TrendingTopicsProps {
  onTopicClick: (topic: string) => void;
  activeHashtag?: string;
  onClearHashtag?: () => void;
}

const TrendingTopics: React.FC<TrendingTopicsProps> = ({ 
  onTopicClick, 
  activeHashtag,
  onClearHashtag
}) => {
  return (
    <TrendingSection 
      onTopicClick={onTopicClick}
      activeHashtag={activeHashtag}
      onClearHashtag={onClearHashtag}
    />
  );
};

export default TrendingTopics;

