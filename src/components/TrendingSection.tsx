
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SearchBar from "@/components/community/SearchBar";
import { useState } from "react";

const TrendingSection = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // This would be fetched from Nostr in a real implementation
  const allTrendingTopics = [
    { name: "Bitcoin", posts: "124K" },
    { name: "Nostr", posts: "87K" },
    { name: "Lightning", posts: "65K" },
    { name: "Decentralization", posts: "42K" },
    { name: "Web5", posts: "38K" },
  ];
  
  // Filter trending topics based on search term
  const trendingTopics = searchTerm 
    ? allTrendingTopics.filter(topic => 
        topic.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : allTrendingTopics;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Trending</CardTitle>
        <div className="mt-2">
          <SearchBar 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
            placeholderText="Search topics..." 
          />
        </div>
      </CardHeader>
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
