
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TrendingSection = () => {
  // This would be fetched from Nostr in a real implementation
  const trendingTopics = [
    { name: "Bitcoin", posts: "124K" },
    { name: "Nostr", posts: "87K" },
    { name: "Lightning", posts: "65K" },
    { name: "Decentralization", posts: "42K" },
    { name: "Web5", posts: "38K" },
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Trending</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="space-y-4">
          {trendingTopics.map((topic) => (
            <div key={topic.name} className="hover:bg-accent/50 px-2 py-1 rounded-md -mx-2 cursor-pointer">
              <div className="font-semibold text-md">#{topic.name}</div>
              <div className="text-sm text-muted-foreground">{topic.posts} posts</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendingSection;
