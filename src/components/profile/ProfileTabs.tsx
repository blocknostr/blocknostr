
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NoteCard from "@/components/NoteCard";
import { NostrEvent } from "@/lib/nostr";
import { Loader2 } from "lucide-react";

interface ProfileTabsProps {
  events: NostrEvent[];
  media: NostrEvent[];
  reposts: { originalEvent: NostrEvent; repostEvent: NostrEvent }[];
  profileData: any;
  originalPostProfiles: Record<string, any>;
  replies?: NostrEvent[];
  reactions?: NostrEvent[];
  referencedEvents?: Record<string, NostrEvent>;
}

const ProfileTabs = ({ 
  events, 
  media, 
  reposts, 
  profileData,
  originalPostProfiles,
  replies = [],
  reactions = [],
  referencedEvents = {}
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
          {events.length === 0 ? (
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
        
        {/* Replies Tab - Now implemented with NIP-10 */}
        <TabsContent value="replies" className="mt-4">
          {replies.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No replies found.
            </div>
          ) : (
            <div className="space-y-4">
              {replies.map(event => (
                <NoteCard 
                  key={event.id} 
                  event={event} 
                  profileData={profileData || undefined}
                  isReply={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Reposts Tab */}
        <TabsContent value="reposts" className="mt-4">
          {reposts.length === 0 ? (
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
          {media.length === 0 ? (
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
        
        {/* Likes Tab - Now implemented with NIP-25 */}
        <TabsContent value="likes" className="mt-4">
          {reactions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No likes found.
            </div>
          ) : (
            <div className="space-y-4">
              {reactions.map(reactionEvent => {
                const eventId = reactionEvent.tags?.find(tag => 
                  Array.isArray(tag) && tag.length >= 2 && tag[0] === 'e'
                )?.[1];
                
                const originalEvent = eventId ? referencedEvents[eventId] : undefined;
                
                if (!originalEvent) {
                  return (
                    <div key={reactionEvent.id} className="p-4 border rounded-md flex items-center justify-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading liked post...</span>
                    </div>
                  );
                }
                
                return (
                  <NoteCard 
                    key={reactionEvent.id}
                    event={originalEvent}
                    profileData={undefined} // We need to fetch this separately
                    reactionData={{
                      emoji: reactionEvent.content || '+',
                      reactionEvent: reactionEvent
                    }}
                  />
                );
              })}
            </div>
          )}
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
