
import { NostrEvent } from "@/lib/nostr";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, Repeat, Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { contentFormatter } from "@/lib/nostr";

interface MyCubePostsProps {
  posts: NostrEvent[];
  loading: boolean;
  refreshing: boolean;
}

const MyCubePosts = ({ posts, loading, refreshing }: MyCubePostsProps) => {
  if (loading || refreshing) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">{loading ? "Loading posts..." : "Refreshing..."}</span>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Posts Yet</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center">
            You haven't made any posts yet.
          </p>
          <Button>Create New Post</Button>
        </CardContent>
      </Card>
    );
  }

  // Sort posts by creation date (newest first)
  const sortedPosts = [...posts].sort((a, b) => b.created_at - a.created_at);

  return (
    <div className="space-y-4">
      {sortedPosts.map((post) => {
        const formattedContent = contentFormatter.formatContent(post.content);
        const createdAt = new Date(post.created_at * 1000);
        const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });
        
        return (
          <Card key={post.id} className="overflow-hidden">
            <CardContent className="pt-6">
              <div className="mb-2 text-sm text-muted-foreground">{timeAgo}</div>
              <div className="whitespace-pre-wrap break-words" 
                dangerouslySetInnerHTML={{ __html: formattedContent }} 
              />
            </CardContent>
            <CardFooter className="border-t p-2 flex justify-between">
              <div className="flex gap-4">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  <span>12</span>
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <Repeat className="h-4 w-4 mr-1" />
                  <span>24</span>
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <Heart className="h-4 w-4 mr-1" />
                  <span>48</span>
                </Button>
              </div>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};

export default MyCubePosts;
