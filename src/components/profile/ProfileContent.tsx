
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostList } from "@/components/feed/PostList";
import { PostSkeleton } from "@/components/feed/PostSkeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, ImageIcon, MessageSquare, Repeat } from "lucide-react";
import { MediaGrid } from "@/components/feed/MediaGrid";
import { extractImagesFromEvents } from "@/lib/nostr/utils/content";

interface ProfileContentProps {
  events: any[];
  profileData: any;
  isLoading: boolean;
  isEmpty: boolean;
  onRefresh: () => void;
  isCurrentUser: boolean;
}

export function ProfileContent({
  events,
  profileData,
  isLoading,
  isEmpty,
  onRefresh,
  isCurrentUser
}: ProfileContentProps) {
  const [activeTab, setActiveTab] = useState("posts");
  
  // Extract media from events for media tab
  const media = React.useMemo(() => {
    return extractImagesFromEvents(events);
  }, [events]);
  
  // Separate posts and replies (simplified - a real implementation would check tags)
  const replies = events.filter(event => 
    event.tags && event.tags.some(tag => tag[0] === 'e')
  );
  
  const posts = events.filter(event => 
    !event.tags || !event.tags.some(tag => tag[0] === 'e')
  );
  
  return (
    <Tabs defaultValue="posts" className="mt-6" onValueChange={setActiveTab}>
      <TabsList className="w-full grid grid-cols-4 md:w-auto md:inline-flex">
        <TabsTrigger value="posts" className="flex gap-1">
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">Posts</span>
          <span className="text-xs text-muted-foreground ml-1">
            {posts.length > 0 ? posts.length : ""}
          </span>
        </TabsTrigger>
        <TabsTrigger value="replies" className="flex gap-1">
          <Repeat className="h-4 w-4" />
          <span className="hidden sm:inline">Replies</span>
          <span className="text-xs text-muted-foreground ml-1">
            {replies.length > 0 ? replies.length : ""}
          </span>
        </TabsTrigger>
        <TabsTrigger value="media" className="flex gap-1">
          <ImageIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Media</span>
          <span className="text-xs text-muted-foreground ml-1">
            {media.length > 0 ? media.length : ""}
          </span>
        </TabsTrigger>
        <TabsTrigger value="about" className="flex gap-1">
          <span className="hidden sm:inline">About</span>
        </TabsTrigger>
      </TabsList>
      
      {/* Progressive loading of content */}
      <TabsContent value="posts" className="mt-4">
        {isLoading ? (
          <div className="space-y-4">
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
        ) : isEmpty ? (
          <div className="text-center py-8 text-muted-foreground">
            {isCurrentUser ? (
              <p>You haven't posted anything yet.</p>
            ) : (
              <p>This user hasn't posted anything yet.</p>
            )}
            <Button 
              variant="outline" 
              size="sm"
              className="mt-4"
              onClick={onRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        ) : (
          <PostList events={posts} showActionButtons={true} />
        )}
      </TabsContent>
      
      <TabsContent value="replies" className="mt-4">
        {isLoading ? (
          <div className="space-y-4">
            <PostSkeleton />
            <PostSkeleton />
          </div>
        ) : replies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No replies found.</p>
            <Button 
              variant="outline" 
              size="sm"
              className="mt-4"
              onClick={onRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        ) : (
          <PostList events={replies} showActionButtons={true} />
        )}
      </TabsContent>
      
      <TabsContent value="media" className="mt-4">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-2 animate-pulse">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="aspect-square bg-muted rounded-md" />
            ))}
          </div>
        ) : media.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No media found.</p>
            <Button 
              variant="outline" 
              size="sm"
              className="mt-4"
              onClick={onRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        ) : (
          <MediaGrid images={media} />
        )}
      </TabsContent>
      
      <TabsContent value="about" className="mt-4">
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-semibold mb-2">About</h3>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {profileData.about || "No about information provided."}
          </p>
          {profileData.website && (
            <div className="mt-4">
              <h4 className="text-sm font-medium">Website</h4>
              <a 
                href={profileData.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {profileData.website}
              </a>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
