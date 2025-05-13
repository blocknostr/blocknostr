
import React, { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NostrEvent } from "@/lib/nostr";
import { useProfileFetcher } from "../feed/hooks/use-profile-fetcher";
import VirtualizedPostList from "./VirtualizedPostList";
import OptimizedMediaGrid from "./OptimizedMediaGrid";

interface ProfileTabsProps {
  events: NostrEvent[];
  media: NostrEvent[];
  reposts: { originalEvent: NostrEvent; repostEvent: NostrEvent }[];
  profileData: any;
  originalPostProfiles: Record<string, any>;
  replies?: NostrEvent[];
  reactions?: NostrEvent[];
  referencedEvents?: Record<string, NostrEvent>;
  loading?: {
    posts: boolean;
    replies: boolean;
    likes: boolean;
  };
  onTabChange?: (tab: string) => void;
}

const ProfileTabs = ({ 
  events = [], 
  media = [], 
  reposts = [], 
  profileData,
  originalPostProfiles = {},
  replies = [],
  reactions = [],
  referencedEvents = {},
  loading = { posts: false, replies: false, likes: false },
  onTabChange
}: ProfileTabsProps) => {
  const { profiles, fetchProfileData } = useProfileFetcher();

  // Handle tab change
  const handleValueChange = (value: string) => {
    if (onTabChange) {
      onTabChange(value);
    }
  };
  
  return (
    <div className="mt-6">
      <Tabs defaultValue="posts" className="w-full" onValueChange={handleValueChange}>
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="replies">Replies</TabsTrigger>
          <TabsTrigger value="reposts">Reposts</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="likes">Likes</TabsTrigger>
        </TabsList>
        
        {/* Posts Tab */}
        <TabsContent value="posts" className="mt-4">
          <VirtualizedPostList
            posts={events}
            profileData={profileData}
            isLoading={loading.posts}
            emptyMessage="No posts found."
          />
        </TabsContent>
        
        {/* Replies Tab */}
        <TabsContent value="replies" className="mt-4">
          <VirtualizedPostList
            posts={replies || []}
            profileData={profileData}
            isLoading={loading.replies}
            emptyMessage="No replies found."
            isReply={true}
          />
        </TabsContent>

        {/* Reposts Tab */}
        <TabsContent value="reposts" className="mt-4">
          {!reposts || reposts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No reposts found.
            </div>
          ) : (
            <div className="space-y-4">
              {reposts.map(({ originalEvent, repostEvent }) => (
                <VirtualizedPostList
                  key={`repost-${repostEvent.id}`}
                  posts={[originalEvent]}
                  profileData={
                    originalEvent && originalEvent.pubkey && 
                    originalPostProfiles && originalPostProfiles[originalEvent.pubkey] 
                      ? originalPostProfiles[originalEvent.pubkey] 
                      : undefined
                  }
                  isLoading={false}
                  emptyMessage=""
                  repostData={{
                    reposterPubkey: repostEvent?.pubkey || '',
                    reposterProfile: profileData
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Media Tab */}
        <TabsContent value="media" className="mt-4">
          <OptimizedMediaGrid media={media} loading={loading.posts} />
        </TabsContent>
        
        {/* Likes Tab */}
        <TabsContent value="likes" className="mt-4">
          <VirtualizedPostList
            posts={reactions?.map(reaction => {
              // Extract the eventId from tags
              const eventId = reaction.tags?.find(tag => 
                Array.isArray(tag) && tag.length >= 2 && tag[0] === 'e'
              )?.[1] || '';
              
              // Return the referenced original event if available
              return referencedEvents?.[eventId] || null;
            }).filter(Boolean) as NostrEvent[] || []}
            profileData={profileData}
            isLoading={loading.likes}
            emptyMessage="No likes found."
            originalPostProfiles={profiles}
            reactionData={reactions?.[0] ? {
              emoji: reactions[0].content || '+',
              reactionEvent: reactions[0]
            } : undefined}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileTabs;
