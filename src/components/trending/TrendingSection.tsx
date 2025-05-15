
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Hash, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define props interface
export interface TrendingSectionProps {
  onTopicClick?: (topic: string) => void;
  activeHashtag?: string;
  onClearHashtag?: () => void;
}

// Mock trending topics data - in a real app, this would come from an API or state
const TRENDING_TOPICS = [
  { tag: "bitcoin", count: 1245 },
  { tag: "nostr", count: 987 },
  { tag: "alephium", count: 542 },
  { tag: "decentralization", count: 321 },
  { tag: "web3", count: 254 },
];

const TrendingSection: React.FC<TrendingSectionProps> = ({
  onTopicClick,
  activeHashtag,
  onClearHashtag
}) => {
  return (
    <Card className="mb-4 overflow-hidden">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-base font-medium flex gap-1.5 items-center">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          Trending
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-3">
        {activeHashtag ? (
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center text-primary font-medium">
              <Hash className="h-4 w-4 opacity-70 mr-1" />
              {activeHashtag}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={onClearHashtag}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <ul className="space-y-1">
            {TRENDING_TOPICS.map((topic) => (
              <li key={topic.tag}>
                <button
                  className={cn(
                    "flex items-center justify-between w-full px-2 py-1.5 rounded-md hover:bg-muted text-left text-sm transition-colors",
                  )}
                  onClick={() => onTopicClick?.(topic.tag)}
                >
                  <div className="flex items-center">
                    <Hash className="h-3.5 w-3.5 opacity-60 mr-1" />
                    {topic.tag}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {topic.count}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default TrendingSection;
