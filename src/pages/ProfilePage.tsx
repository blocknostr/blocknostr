import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { NostrEvent, nostrService, Relay } from "@/lib/nostr";
import { Button } from "@/components/ui/button";
import NoteCard from "@/components/NoteCard";
import Sidebar from "@/components/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import ProfileStats from "@/components/profile/ProfileStats";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileRelays from "@/components/profile/ProfileRelays";
import { useToast } from "@/components/ui/use-toast";

const ProfilePage = () => {
  const { npub } = useParams();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any | null>(null);
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [replies, setReplies] = useState<NostrEvent[]>([]);
  const [media, setMedia] = useState<NostrEvent[]>([]);
  const [reposts, setReposts] = useState<{ 
    originalEvent: NostrEvent; 
    repostEvent: NostrEvent;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [relays, setRelays] = useState<Relay[]>([]);
  const [newRelayUrl, setNewRelayUrl] = useState("");
  const [isAddingRelay, setIsAddingRelay] = useState(false);
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [originalPostProfiles, setOriginalPostProfiles] = useState<Record<string, any>>({});
  const { toast } = useToast();
  
  const currentUserPubkey = nostrService.publicKey;
  const isCurrentUser = currentUserPubkey && 
                       (npub ? nostrService.getHexFromNpub(npub) === currentUserPubkey : false);
  
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!npub) return;
      
      try {
        // Connect to relays if not already connected
        await nostrService.connectToUserRelays();
        
        // Convert npub to hex if needed
        let hexPubkey = npub;
        if (npub.startsWith('npub1')) {
          hexPubkey = nostrService.getHexFromNpub(npub);
        }
        
        // Subscribe to profile metadata (kind 0)
        const metadataSubId = nostrService.subscribe(
          [
            {
              kinds: [0],
              authors: [hexPubkey],
              limit: 1
            }
          ],
          (event) => {
            try {
              const metadata = JSON.parse(event.content);
              setProfileData(metadata);
            } catch (e) {
              console.error('Failed to parse profile metadata:', e);
            }
          }
        );
        
        // Subscribe to user's notes (kind 1)
        const notesSubId = nostrService.subscribe(
          [
            {
              kinds: [1],
              authors: [hexPubkey],
              limit: 50
            }
          ],
          (event) => {
            setEvents(prev => {
              // Check if we already have this event
              if (prev.some(e => e.id === event.id)) {
                return prev;
              }
              
              // Add new event and sort by creation time (newest first)
              return [...prev, event].sort((a, b) => b.created_at - a.created_at);
            });

            // Check if note contains media
            try {
              if (event.content.includes("https://") && 
                 (event.content.includes(".jpg") || 
                  event.content.includes(".jpeg") || 
                  event.content.includes(".png") || 
                  event.content.includes(".gif"))) {
                setMedia(prev => {
                  if (prev.some(e => e.id === event.id)) return prev;
                  return [...prev, event].sort((a, b) => b.created_at - a.created_at);
                });
              }
            } catch (err) {
              console.error("Error processing media:", err);
            }
          }
        );

        // Subscribe to user's reposts (kind 6)
        const repostsSubId = nostrService.subscribe(
          [
            {
              kinds: [6],
              authors: [hexPubkey],
              limit: 50
            }
          ],
          (repostEvent) => {
            try {
              // Try to parse the content first (some clients store event as JSON)
              let originalEventId: string | null = null;
              let originalEventPubkey: string | null = null;

              try {
                const content = JSON.parse(repostEvent.content);
                if (content.event && content.event.id) {
                  originalEventId = content.event.id;
                  originalEventPubkey = content.event.pubkey;
                }
              } catch (e) {
                // If parsing fails, try to get event reference from tags
                const eventReference = repostEvent.tags.find(tag => tag[0] === 'e');
                if (eventReference && eventReference[1]) {
                  originalEventId = eventReference[1];
                  
                  // Find pubkey reference
                  const pubkeyReference = repostEvent.tags.find(tag => tag[0] === 'p');
                  originalEventPubkey = pubkeyReference ? pubkeyReference[1] : null;
                }
              }

              if (originalEventId) {
                // Fetch the original event
                fetchOriginalPost(originalEventId, originalEventPubkey, repostEvent);
              }
            } catch (error) {
              console.error("Error processing repost:", error);
            }
          }
        );

        // Fetch follower/following data
        const contactsSubId = nostrService.subscribe(
          [
            {
              kinds: [3],
              authors: [hexPubkey],
              limit: 1
            }
          ],
          (event) => {
            try {
              // Extract tags with 'p' which indicate following
              const followingList = event.tags
                .filter(tag => tag[0] === 'p')
                .map(tag => tag[1]);
              
              setFollowing(followingList);
            } catch (e) {
              console.error('Failed to parse contacts:', e);
            }
          }
        );

        // Fetch followers (other users who have this user in their contacts)
        const followersSubId = nostrService.subscribe(
          [
            {
              kinds: [3],
              "#p": [hexPubkey],
              limit: 50
            }
          ],
          (event) => {
            const followerPubkey = event.pubkey;
            setFollowers(prev => {
              if (prev.includes(followerPubkey)) return prev;
              return [...prev, followerPubkey];
            });
          }
        );
        
        setLoading(false);
        
        return () => {
          nostrService.unsubscribe(metadataSubId);
          nostrService.unsubscribe(notesSubId);
          nostrService.unsubscribe(repostsSubId);
          nostrService.unsubscribe(contactsSubId);
          nostrService.unsubscribe(followersSubId);
        };
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error loading profile",
          description: "Could not load profile data. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };
    
    const fetchOriginalPost = (eventId: string, pubkey: string | null, repostEvent: NostrEvent) => {
      // Subscribe to the original event by ID
      const eventSubId = nostrService.subscribe(
        [
          {
            ids: [eventId],
            kinds: [1]
          }
        ],
        (originalEvent) => {
          setReposts(prev => {
            if (prev.some(r => r.originalEvent.id === originalEvent.id)) {
              return prev;
            }
            
            const newRepost = {
              originalEvent,
              repostEvent
            };
            
            return [...prev, newRepost].sort(
              (a, b) => b.repostEvent.created_at - a.repostEvent.created_at
            );
          });
          
          // Fetch profile data for the original author if we don't have it yet
          if (originalEvent.pubkey && !originalPostProfiles[originalEvent.pubkey]) {
            const metadataSubId = nostrService.subscribe(
              [
                {
                  kinds: [0],
                  authors: [originalEvent.pubkey],
                  limit: 1
                }
              ],
              (event) => {
                try {
                  const metadata = JSON.parse(event.content);
                  setOriginalPostProfiles(prev => ({
                    ...prev,
                    [originalEvent.pubkey]: metadata
                  }));
                } catch (e) {
                  console.error('Failed to parse profile metadata for repost:', e);
                }
              }
            );
            
            // Cleanup subscription after a short time
            setTimeout(() => {
              nostrService.unsubscribe(metadataSubId);
            }, 5000);
          }
        }
      );
      
      // Cleanup subscription after a short time
      setTimeout(() => {
        nostrService.unsubscribe(eventSubId);
      }, 5000);
    };
    
    fetchProfileData();
    
    // Load relay status if this is the current user
    if (isCurrentUser) {
      const relayStatus = nostrService.getRelayStatus();
      setRelays(relayStatus);
    }
  }, [npub, isCurrentUser, toast]);
  
  // Show current user's profile if no npub is provided
  useEffect(() => {
    if (!npub && currentUserPubkey) {
      window.location.href = `/profile/${nostrService.formatPubkey(currentUserPubkey)}`;
    }
  }, [npub, currentUserPubkey]);
  
  const handleMessageUser = () => {
    if (!npub) return;
    
    // Navigate to messages page
    navigate('/messages');
    
    // We'll let the messages page handle loading the contact
    localStorage.setItem('lastMessagedUser', npub);
  };
  
  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 ml-0 md:ml-64 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-0 md:ml-64">
        <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center h-14 px-4">
            <h1 className="font-semibold">Profile</h1>
          </div>
        </header>
        
        <div className="max-w-3xl mx-auto px-4 py-4">
          <ProfileHeader 
            profileData={profileData}
            npub={npub || ''}
            isCurrentUser={isCurrentUser}
            onMessage={handleMessageUser}
          />
          
          <ProfileStats 
            followers={followers}
            following={following}
            postsCount={events.length + reposts.length}
            relays={relays.filter(r => r.status === 'connected').length}
            isCurrentUser={isCurrentUser}
          />
          
          {/* Relays section (only for current user) */}
          {isCurrentUser && (
            <ProfileRelays 
              relays={relays}
              onRelaysChange={setRelays}
            />
          )}
          
          {/* Tabbed Content */}
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
                          onClick={() => navigate(`/note/${event.id}`)}
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
        </div>
      </div>
    </div>
  );
};

// Helper function to extract the first image URL from content
const extractImageUrl = (content: string): string => {
  const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif))/i;
  const matches = content.match(urlRegex);
  return matches ? matches[0] : '';
};

export default ProfilePage;
