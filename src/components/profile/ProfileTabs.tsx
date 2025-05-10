
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NostrEvent } from '@/lib/nostr';
import NoteCard from '../NoteCard';

interface ProfileTabsProps {
  events: NostrEvent[];
  reposts: { originalEvent: NostrEvent; repostEvent: NostrEvent }[];
  media: NostrEvent[];
  profileData: any;
  originalPostProfiles: Record<string, any>;
  onRetweetStatusChange: (eventId: string, isRetweeted: boolean) => void;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({
  events,
  reposts,
  media,
  profileData,
  originalPostProfiles,
  onRetweetStatusChange
}) => {
  return (
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
      
      {/* Replies Tab */}
      <TabsContent value="replies" className="mt-4">
        <div className="py-8 text-center text-muted-foreground">
          Replies coming soon.
        </div>
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
                onRetweetStatusChange={onRetweetStatusChange}
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
              <MediaItem key={event.id} event={event} />
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
  );
};

interface MediaItemProps {
  event: NostrEvent;
}

const MediaItem: React.FC<MediaItemProps> = ({ event }) => {
  const imageUrl = extractImageUrl(event.content);
  
  return (
    <div className="aspect-square overflow-hidden rounded-md border bg-muted">
      <img 
        src={imageUrl} 
        alt="Media" 
        className="h-full w-full object-cover transition-all hover:scale-105"
      />
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
