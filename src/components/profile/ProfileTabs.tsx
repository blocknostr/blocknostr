
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NoteCard from "@/components/NoteCard";
import { NostrEvent } from "@/lib/nostr";
import FeedLoadingSkeleton from "../feed/FeedLoadingSkeleton";

interface ProfileTabsProps {
  events: NostrEvent[];
  media: NostrEvent[];
  reposts: { originalEvent: NostrEvent; repostEvent: NostrEvent }[];
  profileData: any;
  originalPostProfiles: Record<string, any>;
  isLoading?: boolean;
}

const ProfileTabs = ({ 
  events, 
  media, 
  reposts, 
  profileData,
  originalPostProfiles,
  isLoading = false
}: ProfileTabsProps) => {
  return (
    <div className="mt-6">
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="replies">Replies</TabsTrigger>
          <TabsTrigger value="reposts">Reposts</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="likes">Likes</TabsTrigger>
        </TabsList>
        
        {/* Posts Tab */}
        <TabsContent value="posts" className="mt-4">
          {isLoading ? (
            <FeedLoadingSkeleton count={3} />
          ) : events.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No posts found.
            </div>
          ) : (
            <div className="space-y-4">
              {events.map(event => (
                <NoteCard 
                  key={event.id} 
                  event={event} 
                  profileData={profileData || undefined} 
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Replies Tab */}
        <TabsContent value="replies" className="mt-4">
          <div className="py-8 text-center text-muted-foreground">
            Replies coming soon.
          </div>
        </TabsContent>

        {/* Reposts Tab */}
        <TabsContent value="reposts" className="mt-4">
          {isLoading ? (
            <FeedLoadingSkeleton count={2} />
          ) : reposts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No reposts found.
            </div>
          ) : (
            <div className="space-y-4">
              {reposts.map(({ originalEvent, repostEvent }) => (
                <NoteCard 
                  key={originalEvent.id} 
                  event={originalEvent} 
                  profileData={originalEvent.pubkey ? originalPostProfiles[originalEvent.pubkey] : undefined}
                  repostData={{
                    reposterPubkey: repostEvent.pubkey || '',
                    reposterProfile: profileData
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Media Tab */}
        <TabsContent value="media" className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square">
                  <Skeleton className="h-full w-full rounded-md" />
                </div>
              ))}
            </div>
          ) : media.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No media found.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {media.map(event => (
                <div key={event.id} className="aspect-square overflow-hidden rounded-md border bg-muted">
                  <img 
                    src={extractImageUrl(event.content)} 
                    alt="Media" 
                    className="h-full w-full object-cover transition-all hover:scale-105"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = `/post/${event.id}`;
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Likes Tab */}
        <TabsContent value="likes" className="mt-4">
          <div className="py-8 text-center text-muted-foreground">
            Likes coming soon.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper function to extract the first image URL from content
const extractImageUrl = (content: string): string => {
  const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif))/i;
  const matches = content.match(urlRegex);
  return matches ? matches[0] : '';
};

export default ProfileTabs;
