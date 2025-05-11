
import React from "react";
import { CardContent } from "@/components/ui/card";
import TrendingTopicItem from "./TrendingTopicItem";
import { Topic } from "./types";

interface TrendingTopicsListProps {
  topics: Topic[];
  onTopicClick: (topic: string) => void;
}

const TrendingTopicsList: React.FC<TrendingTopicsListProps> = ({ topics, onTopicClick }) => {
  return (
    <CardContent className="px-4 pb-3">
      <div className="space-y-4">
        {topics.length > 0 ? (
          topics.map((topic) => (
            <TrendingTopicItem
              key={topic.name}
              name={topic.name}
              posts={topic.posts}
              onClick={() => onTopicClick(topic.name)}
            />
          ))
        ) : (
          <div className="text-center py-2 text-muted-foreground">
            No topics found
          </div>
        )}
      </div>
    </CardContent>
  );
};

export default TrendingTopicsList;
