
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
  // Instead of using the internal trending logic here,
  // we'll use the TrendingSection component which has been updated
  // to show the activeHashtag
  return (
    <TrendingSection 
      onTopicClick={onTopicClick}
      activeHashtag={activeHashtag}
      onClearHashtag={onClearHashtag}
    />
  );
};

export default TrendingTopics;
