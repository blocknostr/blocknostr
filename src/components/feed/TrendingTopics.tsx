
import React, { useState, useEffect } from "react";
import { Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";

interface TrendingTopicsProps {
  onTopicClick: (topic: string) => void;
}

const TrendingTopics: React.FC<TrendingTopicsProps> = ({ onTopicClick }) => {
  const [topics, setTopics] = useState<string[]>([]);
  const { darkMode } = useTheme();
  
  useEffect(() => {
    // In a real app, these would be fetched from the Nostr network
    // For now, we'll use some sample topics
    setTopics([
      'bitcoin',
      'nostr',
      'alephium',
      'defi',
      'privacy',
      'web5',
      'lightning',
      'decentralization',
      'blocknoster'
    ]);
  }, []);
  
  const handleTopicClick = (topic: string) => {
    onTopicClick(topic);
  };
  
  if (topics.length === 0) {
    return null;
  }
  
  return (
    <Card className={`p-3 mb-4 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Hash className="h-4 w-4 text-primary" />
        <h3 className="font-medium text-sm">Trending Topics</h3>
      </div>
      
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex flex-wrap gap-2">
          {topics.map((topic) => (
            <Button 
              key={topic}
              variant="outline" 
              size="sm"
              className="rounded-full text-xs px-3 py-1 h-auto"
              onClick={() => handleTopicClick(topic)}
            >
              #{topic}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Card>
  );
};

export default TrendingTopics;
