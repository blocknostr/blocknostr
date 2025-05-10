
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, ZapIcon, Heart } from "lucide-react";

const TrendingSection = () => {
  const [activeFilter, setActiveFilter] = useState("popular");
  
  // This would be fetched from Nostr in a real implementation
  const allTrendingTopics = [
    { name: "Bitcoin", posts: "124K" },
    { name: "Nostr", posts: "87K" },
    { name: "Lightning", posts: "65K" },
    { name: "Decentralization", posts: "42K" },
    { name: "Web5", posts: "38K" },
  ];

  const mostZappedTopics = [
    { name: "Bitcoin", posts: "98K" },
    { name: "Nostr", posts: "76K" },
    { name: "Sats", posts: "54K" },
    { name: "Lightning", posts: "41K" },
    { name: "BTC", posts: "32K" },
  ];

  const mostLiked24hTopics = [
    { name: "Nostr", posts: "42K" },
    { name: "Bitcoin", posts: "38K" },
    { name: "AI", posts: "25K" },
    { name: "Web5", posts: "19K" },
    { name: "Tech", posts: "12K" },
  ];
  
  // Get the appropriate topics based on the active filter
  const getTrendingTopics = () => {
    switch (activeFilter) {
      case "popular":
        return allTrendingTopics;
      case "zapped":
        return mostZappedTopics;
      case "liked24h":
        return mostLiked24hTopics;
      default:
        return allTrendingTopics;
    }
  };
  
  const trendingTopics = getTrendingTopics();
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Trending</CardTitle>
      </CardHeader>
      
      <div className="px-4 pb-2">
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
              <span className="hidden sm:inline">Liked 24h</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <CardContent className="px-4 pb-3">
        <div className="space-y-4">
          {trendingTopics.length > 0 ? (
            trendingTopics.map((topic) => (
              <div key={topic.name} className="hover:bg-accent/50 px-2 py-1 rounded-md -mx-2 cursor-pointer">
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
