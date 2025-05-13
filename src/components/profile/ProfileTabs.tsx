import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NoteCard from "@/components/NoteCard";
import { NostrEvent, nostrService } from "@/lib/nostr";
import { Loader2 } from "lucide-react";
import { useProfileFetcher } from "../feed/hooks/use-profile-fetcher";
import { extractFirstImageUrl } from "@/lib/nostr/utils";
import { useProfileReplies } from "@/hooks/profile/useProfileReplies";
import { useProfileLikes } from "@/hooks/profile/useProfileLikes";
import { useProfileReposts } from "@/hooks/profile/useProfileReposts";

interface ProfileTabsProps {
  events: NostrEvent[];
  media: NostrEvent[];
  reposts: { originalEvent: NostrEvent; repostEvent: NostrEvent }[];
  profileData: any;
  originalPostProfiles: Record<string, any>;
  replies?: NostrEvent[];
  reactions?: NostrEvent[];
  referencedEvents?: Record<string, any>;
  hexPubkey?: string;
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
  hexPubkey = ""
}: ProfileTabsProps) => {
  const { profiles, fetchProfileData } = useProfileFetcher();
  const [activeTab, setActiveTab] = useState("posts");
  const [loadingReactionProfiles, setLoadingReactionProfiles] = useState(false);
  
  // Tab-specific data loading hooks
  const { 
    replies: tabReplies, 
    loading: repliesLoading 
  } = useProfileReplies({ 
    hexPubkey, 
    enabled: activeTab === "replies" 
  });
  
  const { 
    reactions: tabReactions, 
    referencedEvents: tabReferencedEvents, 
    loading: reactionsLoading 
  } = useProfileLikes({ 
    hexPubkey, 
    enabled: activeTab === "likes" 
  });
  
  // State for displayed posts (with pagination)
  const [displayedPosts, setDisplayedPosts] = useState<NostrEvent[]>([]);
  const [displayedMedia, setDisplayedMedia] = useState<NostrEvent[]>([]);
  const [displayedReplies, setDisplayedReplies] = useState<NostrEvent[]>([]);
  const [displayedReactions, setDisplayedReactions] = useState<NostrEvent[]>([]);
  const [postsLimit, setPostsLimit] = useState(10);
  
  // State for reposts tab
  const [tabReposts, setTabReposts] = useState<{ originalEvent: NostrEvent; repostEvent: NostrEvent }[]>([]);
  const [repostsLoading, setRepostsLoading] = useState(false);
  
  // Setup for reposts tab
  useEffect(() => {
    if (activeTab !== "reposts" || !hexPubkey) return;
    
    setRepostsLoading(true);
    
    // Create a temporary repo for reposts data management
    const tempPostProfiles: Record<string, any> = { ...originalPostProfiles };
    
    const { reposts: fetchedReposts, fetchOriginalPost } = useProfileReposts({
      originalPostProfiles: tempPostProfiles,
      setOriginalPostProfiles: (newProfiles) => {
        Object.assign(tempPostProfiles, newProfiles);
      }
    });
    
    // Fetch reposts when tab is active
    const fetchReposts = async () => {
      if (!hexPubkey) return;
      
      try {
        // Subscribe to user's reposts (kind 6)
        const subId = nostrService.subscribe(
          [
            {
              kinds: [6], // Reposts
              authors: [hexPubkey],
              limit: 30
            }
          ],
          (repostEvent) => {
            // Get the original event ID
            const eTag = repostEvent.tags?.find(tag => 
              Array.isArray(tag) && tag.length >= 2 && tag[0] === 'e'
            );
            
            if (eTag && eTag[1]) {
              fetchOriginalPost(eTag[1], repostEvent.pubkey, repostEvent);
            }
          }
        );
        
        // Cleanup subscription after some time
        setTimeout(() => {
          nostrService.unsubscribe(subId);
          setRepostsLoading(false);
        }, 5000);
        
      } catch (error) {
        console.error("Error fetching reposts:", error);
        setRepostsLoading(false);
      }
    };
    
    fetchReposts();
    
    // Update reposts when they're available
    if (fetchedReposts.length > 0) {
      setTabReposts(fetchedReposts);
    }
  }, [activeTab, hexPubkey]);
  
  // Load more posts when scrolling
  const loadMorePosts = () => {
    setPostsLimit(prev => prev + 10);
  };
  
  // Update displayed posts based on limit
  useEffect(() => {
    setDisplayedPosts(events.slice(0, postsLimit));
  }, [events, postsLimit]);
  
  // Update displayed media based on limit
  useEffect(() => {
    setDisplayedMedia(media.slice(0, postsLimit));
  }, [media, postsLimit]);
  
  // Update displayed replies based on limit
  useEffect(() => {
    if (activeTab === "replies") {
      const repliesData = tabReplies.length > 0 ? tabReplies : replies;
      setDisplayedReplies(repliesData.slice(0, postsLimit));
    }
  }, [activeTab, tabReplies, replies, postsLimit]);
  
  // Update displayed reactions based on limit
  useEffect(() => {
    if (activeTab === "likes") {
      const reactionsData = tabReactions.length > 0 ? tabReactions : reactions || [];
      setDisplayedReactions(reactionsData.slice(0, postsLimit));
    }
  }, [activeTab, tabReactions, reactions, postsLimit]);
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPostsLimit(10); // Reset pagination when changing tabs
  };
  
  // Fetch profiles for reaction posts when likes tab is active
  useEffect(() => {
    const fetchReactionProfiles = async () => {
      // Only fetch if we're on the likes tab and have referenced events
      if (activeTab !== "likes" || !tabReferencedEvents || Object.keys(tabReferencedEvents).length === 0) {
        return;
      }
      
      setLoadingReactionProfiles(true);
      
      try {
        // Get unique author pubkeys from referenced events
        const authorPubkeys = Object.values(tabReferencedEvents)
          .filter(event => !!event?.pubkey)
          .map(event => event.pubkey);
        
        if (authorPubkeys.length === 0) {
          setLoadingReactionProfiles(false);
          return;
        }
        
        // Fetch profiles for all authors
        const uniquePubkeys = [...new Set(authorPubkeys)];
        
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
  }, [activeTab, tabReferencedEvents, fetchProfileData]);
  
  // Detect when we're near the bottom to load more
  const handleScroll = () => {
    const scrollPosition = window.innerHeight + document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollThreshold = scrollHeight - 300;
    
    if (scrollPosition > scrollThreshold) {
      loadMorePosts();
    }
  };
  
  // Add scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <div className="mt-6">
      <Tabs 
        defaultValue="posts" 
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="replies">Replies</TabsTrigger>
          <TabsTrigger value="reposts">Reposts</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="likes">Likes</TabsTrigger>
        </TabsList>
        
        {/* Posts Tab */}
        <TabsContent value="posts" className="mt-4">
          {!Array.isArray(displayedPosts) || displayedPosts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No posts found.
            </div>
          ) : (
            <div className="space-y-4">
              {displayedPosts.map(event => (
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
          {repliesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading replies...</span>
            </div>
          ) : !displayedReplies || displayedReplies.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No replies found.
            </div>
          ) : (
            <div className="space-y-4">
              {displayedReplies.map(event => (
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
          {repostsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading reposts...</span>
            </div>
          ) : (!tabReposts || tabReposts.length === 0) && (!reposts || reposts.length === 0) ? (
            <div className="py-8 text-center text-muted-foreground">
              No reposts found.
            </div>
          ) : (
            <div className="space-y-4">
              {(tabReposts.length > 0 ? tabReposts : reposts).slice(0, postsLimit).map(({ originalEvent, repostEvent }) => (
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
          {!displayedMedia || displayedMedia.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No media found.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {displayedMedia.map(event => {
                const imageUrl = extractFirstImageUrl(event.content, event.tags);
                if (!imageUrl) return null;
                
                return (
                  <div key={event.id} className="aspect-square overflow-hidden rounded-md border bg-muted">
                    <img 
                      src={imageUrl}
                      alt="Media" 
                      className="h-full w-full object-cover transition-all hover:scale-105"
                      loading="lazy"
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
        
        {/* Likes Tab */}
        <TabsContent value="likes" className="mt-4">
          {reactionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading likes...</span>
            </div>
          ) : !tabReactions || tabReactions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No likes found.
            </div>
          ) : (
            <div className="space-y-4">
              {displayedReactions.map(reactionEvent => {
                // Safely extract the eventId from tags with null checks
                let eventId = '';
                if (reactionEvent && reactionEvent.tags && Array.isArray(reactionEvent.tags)) {
                  const eTag = reactionEvent.tags.find(tag => 
                    Array.isArray(tag) && tag.length >= 2 && tag[0] === 'e'
                  );
                  eventId = eTag ? eTag[1] : '';
                }
                
                if (!eventId) return null;
                
                // Use tab-specific referenced events if available
                const referencedEventsSource = tabReferencedEvents && Object.keys(tabReferencedEvents).length > 0 
                  ? tabReferencedEvents 
                  : referencedEvents || {};
                
                const originalEvent = referencedEventsSource[eventId];
                
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
