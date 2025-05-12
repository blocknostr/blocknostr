
import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NoteCard from "@/components/note/NoteCard";
import { NostrEvent, nostrService } from "@/lib/nostr";
import { Loader2 } from "lucide-react";
import { useProfileFetcher } from "../feed/hooks/use-profile-fetcher";
import { extractFirstImageUrl } from "@/lib/nostr/utils";

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
  events = [], 
  media = [], 
  reposts = [], 
  profileData,
  originalPostProfiles = {},
  replies = [],
  reactions = [],
  referencedEvents = {}
}: ProfileTabsProps) => {
  const { profiles, fetchProfileData } = useProfileFetcher();
  const [loadingReactionProfiles, setLoadingReactionProfiles] = useState(false);

  // Fetch profiles for posts in the reactions tab
  useEffect(() => {
    const fetchReactionProfiles = async () => {
      // Add null checks for reactions and referencedEvents
      if (!reactions || !Array.isArray(reactions) || reactions.length === 0 || !referencedEvents) {
        return;
      }
      
      setLoadingReactionProfiles(true);
      
      try {
        // Get unique author pubkeys from referenced events
        const authorPubkeys = Object.values(referencedEvents)
          .filter(event => !!event?.pubkey)
          .map(event => event.pubkey);
        
        if (authorPubkeys.length === 0) {
          setLoadingReactionProfiles(false);
          return;
        }
        
        // Fetch profiles for all authors
        const uniquePubkeys = [...new Set(authorPubkeys)]; // Remove duplicates
        
        for (const pubkey of uniquePubkeys) {
          try {
            await fetchProfileData(pubkey);
          } catch (error) {
            console.error(`Error fetching profile for ${pubkey}:`, error);
          }
        }
      } catch (error) {
        console.error("Error fetching reaction profiles:", error);
      } finally {
        setLoadingReactionProfiles(false);
      }
    };
    
    fetchReactionProfiles();
  }, [reactions, referencedEvents, fetchProfileData]);
  
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
          {!Array.isArray(events) || events.length === 0 ? (
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
          {!replies || !Array.isArray(replies) || replies.length === 0 ? (
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
          {!reposts || !Array.isArray(reposts) || reposts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No reposts found.
            </div>
          ) : (
            <div className="space-y-4">
              {reposts.map(({ originalEvent, repostEvent }) => (
                <NoteCard 
                  key={originalEvent.id} 
                  event={originalEvent} 
                  profileData={
                    originalEvent && originalEvent.pubkey && 
                    originalPostProfiles && originalPostProfiles[originalEvent.pubkey] 
                      ? originalPostProfiles[originalEvent.pubkey] 
                      : undefined
                  }
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
          {!media || !Array.isArray(media) || media.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No media found.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {media.map(event => {
                const imageUrl = extractFirstImageUrl(event.content, event.tags);
                if (!imageUrl) return null;
                
                return (
                  <div key={event.id} className="aspect-square overflow-hidden rounded-md border bg-muted">
                    <img 
                      src={imageUrl}
                      alt="Media" 
                      className="h-full w-full object-cover transition-all hover:scale-105"
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = `/post/${event.id}`;
                      }}
                    />
                  </div>
                );
              }).filter(Boolean)}
            </div>
          )}
        </TabsContent>
        
        {/* Likes Tab - Now implemented with NIP-25 */}
        <TabsContent value="likes" className="mt-4">
          {!reactions || !Array.isArray(reactions) || reactions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No likes found.
            </div>
          ) : (
            <div className="space-y-4">
              {reactions.map(reactionEvent => {
                // Safely extract the eventId from tags with null checks
                let eventId = '';
                if (reactionEvent && reactionEvent.tags && Array.isArray(reactionEvent.tags)) {
                  const eTag = reactionEvent.tags.find(tag => 
                    Array.isArray(tag) && tag.length >= 2 && tag[0] === 'e'
                  );
                  eventId = eTag ? eTag[1] : '';
                }
                
                if (!eventId || !referencedEvents) return null;
                
                const originalEvent = referencedEvents[eventId];
                
                if (!originalEvent) {
                  return (
                    <div key={reactionEvent.id} className="p-4 border rounded-md flex items-center justify-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading liked post...</span>
                    </div>
                  );
                }
                
                // Get the profile data for the author of the original post with null checks
                const originalAuthorProfileData = originalEvent.pubkey && profiles ? profiles[originalEvent.pubkey] : undefined;
                
                return (
                  <NoteCard 
                    key={reactionEvent.id}
                    event={originalEvent}
                    profileData={originalAuthorProfileData}
                    reactionData={{
                      emoji: reactionEvent.content || '+',
                      reactionEvent: reactionEvent
                    }}
                  />
                );
              }).filter(Boolean)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileTabs;
