
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, ZapIcon, Heart } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TrendingSectionProps {
  onTopicClick?: (topic: string) => void;
}

const TrendingSection = ({ onTopicClick }: TrendingSectionProps) => {
  const [activeFilter, setActiveFilter] = useState("popular");
  const [timeRange, setTimeRange] = useState("all");
  
  // This would be fetched from Nostr in a real implementation
  const allTimeTrendingTopics = [
    { name: "Bitcoin", posts: "124K" },
    { name: "Nostr", posts: "87K" },
    { name: "Lightning", posts: "65K" },
    { name: "Decentralization", posts: "42K" },
    { name: "Web5", posts: "38K" },
  ];

  const last24HTrendingTopics = [
    { name: "Bitcoin", posts: "18K" },
    { name: "AI", posts: "15K" },
    { name: "Nostr", posts: "12K" },
    { name: "OpenAI", posts: "10K" },
    { name: "Tech", posts: "8K" },
  ];

  const last7DTrendingTopics = [
    { name: "Bitcoin", posts: "56K" },
    { name: "Nostr", posts: "43K" },
    { name: "Lightning", posts: "32K" },
    { name: "Ethereum", posts: "28K" },
    { name: "Privacy", posts: "21K" },
  ];

  const mostZappedTopics = {
    all: [
      { name: "Bitcoin", posts: "98K" },
      { name: "Nostr", posts: "76K" },
      { name: "Sats", posts: "54K" },
      { name: "Lightning", posts: "41K" },
      { name: "BTC", posts: "32K" },
    ],
    "24h": [
      { name: "Bitcoin", posts: "14K" },
      { name: "Nostr", posts: "11K" },
      { name: "Lightning", posts: "8K" },
      { name: "Sats", posts: "7K" },
      { name: "Decentralization", posts: "5K" },
    ],
    "7d": [
      { name: "Bitcoin", posts: "46K" },
      { name: "Nostr", posts: "38K" },
      { name: "Sats", posts: "29K" },
      { name: "Lightning", posts: "21K" },
      { name: "BTC", posts: "16K" },
    ]
  };

  const mostLikedTopics = {
    all: [
      { name: "Nostr", posts: "42K" },
      { name: "Bitcoin", posts: "38K" },
      { name: "AI", posts: "25K" },
      { name: "Web5", posts: "19K" },
      { name: "Tech", posts: "12K" },
    ],
    "24h": [
      { name: "Nostr", posts: "8K" },
      { name: "Bitcoin", posts: "7K" },
      { name: "AI", posts: "5K" },
      { name: "Tech", posts: "3K" },
      { name: "Privacy", posts: "2K" },
    ],
    "7d": [
      { name: "Nostr", posts: "24K" },
      { name: "Bitcoin", posts: "21K" },
      { name: "AI", posts: "16K" },
      { name: "Web5", posts: "12K" },
      { name: "Tech", posts: "9K" },
    ]
  };
  
  // Get the appropriate topics based on the active filter and time range
  const getTrendingTopics = () => {
    switch (activeFilter) {
      case "popular":
        if (timeRange === "24h") return last24HTrendingTopics;
        if (timeRange === "7d") return last7DTrendingTopics;
        return allTimeTrendingTopics;
      case "zapped":
        return mostZappedTopics[timeRange as keyof typeof mostZappedTopics];
      case "liked24h":
        return mostLikedTopics[timeRange as keyof typeof mostLikedTopics];
      default:
        return allTimeTrendingTopics;
    }
  };
  
  const trendingTopics = getTrendingTopics();
  
  const handleTopicClick = (topic: string) => {
    if (onTopicClick) {
      onTopicClick(topic);
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Trending</CardTitle>
      </CardHeader>
      
      <div className="px-4 pb-2">
        <div className="flex flex-col gap-2">
          <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
            <TabsList className="grid grid-cols-3 mb-2">
              <TabsTrigger value="popular" className="text-xs flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span className="hidden sm:inline">Popular</span>
              </TabsTrigger>
              <TabsTrigger value="zapped" className="text-xs flex items-center gap-1">
                <ZapIcon className="h-3 w-3" />
                <span className="hidden sm:inline">Most Zapped</span>
              </TabsTrigger>
              <TabsTrigger value="liked24h" className="text-xs flex items-center gap-1">
                <Heart className="h-3 w-3" />
                <span className="hidden sm:inline">Liked</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <CardContent className="px-4 pb-3">
        <div className="space-y-4">
          {trendingTopics.length > 0 ? (
            trendingTopics.map((topic) => (
              <div 
                key={topic.name} 
                className="hover:bg-accent/50 px-2 py-1 rounded-md -mx-2 cursor-pointer transition-colors"
                onClick={() => handleTopicClick(topic.name)}
              >
                <div className="font-semibold text-md">#{topic.name}</div>
                <div className="text-sm text-muted-foreground">{topic.posts} posts</div>
              </div>
            ))
          ) : (
            <div className="text-center py-2 text-muted-foreground">
              No topics found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendingSection;
