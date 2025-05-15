
import React from "react";
import { useRouter } from "react-router-dom";
import { HashtagIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useTrendingTopicsData } from "./hooks/useTrendingTopicsData";

interface TrendingHashtagsBarProps {
  onSelectHashtag?: (hashtag: string) => void;
  className?: string;
}

const TrendingHashtagsBar: React.FC<TrendingHashtagsBarProps> = ({ 
  onSelectHashtag,
  className
}) => {
  const router = useRouter();
  const { topics, isLoading } = useTrendingTopicsData({
    timeRange: '24h',
    limit: 8
  });

  const handleHashtagClick = (hashtag: string) => {
    if (onSelectHashtag) {
      onSelectHashtag(hashtag);
    } else {
      router.navigate(`/?hashtag=${encodeURIComponent(hashtag)}`);
    }
  };

  if (isLoading || topics.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-1.5 overflow-x-auto py-2 px-2 scrollbar-hide", className)}>
      <HashtagIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      
      {topics.map((topic) => (
        <Badge 
          key={topic.tag}
          variant="outline" 
          className="flex-shrink-0 cursor-pointer hover:bg-muted/60 transition-colors"
          onClick={() => handleHashtagClick(topic.tag.replace('#', ''))}
        >
          {topic.tag}
        </Badge>
      ))}
    </div>
  );
};

export default TrendingHashtagsBar;
