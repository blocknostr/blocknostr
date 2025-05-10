
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { nostrService } from "@/lib/nostr";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileStats from "@/components/profile/ProfileStats";
import ProfileRelays from "@/components/profile/ProfileRelays";
import NoteCard from "@/components/NoteCard";

const ProfilePage = () => {
  const { npub } = useParams();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [following, setFollowing] = useState<string[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [postsCount, setPostsCount] = useState(0);
  const [relays, setRelays] = useState<any[]>([]);

  // Determine if this is the current user's profile
  const currentUserPubkey = nostrService.publicKey;
  const isCurrentUser = !npub || 
                       (npub && currentUserPubkey && 
                        (npub === currentUserPubkey || 
                         nostrService.getHexFromNpub(npub) === currentUserPubkey));
  
  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      
      try {
        // If no npub is provided and user is logged in, use current user's pubkey
        const targetPubkey = npub || currentUserPubkey;
        
        if (!targetPubkey) {
          // If no npub and not logged in, redirect to home
          navigate('/');
          return;
        }
        
        // Convert npub to hex if needed
        let hexPubkey = targetPubkey;
        if (targetPubkey.startsWith('npub1')) {
          hexPubkey = nostrService.getHexFromNpub(targetPubkey);
        }
        
        // Connect to relays if not already connected
        await nostrService.connectToUserRelays();
        
        // Fetch profile data
        const profile = await nostrService.getUserProfile(hexPubkey);
        setProfileData(profile);
        
        // Fetch following list
        const userFollowing = await nostrService.getFollowing(hexPubkey);
        setFollowing(userFollowing);
        
        // Fetch followers
        const userFollowers = await nostrService.getFollowers(hexPubkey);
        setFollowers(userFollowers);
        
        // Fetch post count
        const count = await nostrService.getPostCount(hexPubkey);
        setPostsCount(count);
        
        // Subscribe to user's notes
        const notesSubId = nostrService.subscribe(
          [
            {
              kinds: [1], // Text notes
              authors: [hexPubkey],
              limit: 20
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
          }
        );
        
        // Fetch relays if current user
        if (isCurrentUser) {
          const userRelays = nostrService.getRelayStatus();
          setRelays(userRelays);
        }
        
        // Cleanup subscription after component unmounts
        return () => {
          nostrService.unsubscribe(notesSubId);
        };
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
  }, [npub, currentUserPubkey, isCurrentUser, navigate]);
  
  const handleOpenDM = () => {
    if (npub) {
      navigate(`/messages?to=${npub}`);
    }
  };
  
  const handleRelaysChange = (newRelays: any[]) => {
    setRelays(newRelays);
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-48 bg-muted rounded-t-lg"></div>
        <div className="relative">
          <Skeleton className="h-24 w-24 rounded-full absolute -top-12 left-4" />
          <div className="pt-16 px-4 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-full mt-4" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)} 
        className="mb-4"
      >
        ← Back
      </Button>
      
      <ProfileHeader 
        profileData={profileData}
        npub={npub || ''}
        isCurrentUser={isCurrentUser}
        onMessage={handleOpenDM}
      />
      
      <ProfileStats 
        following={following}
        followers={followers}
        postsCount={postsCount}
        currentUserPubkey={currentUserPubkey}
        isCurrentUser={isCurrentUser}
        relays={relays}
        onRelaysChange={handleRelaysChange}
      />
      
      {isCurrentUser && (
        <ProfileRelays
          relays={relays}
          onRelaysChange={handleRelaysChange}
        />
      )}
      
      <Tabs defaultValue="posts" className="mt-6">
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="replies">Replies</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="likes">Likes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="mt-4">
          {events.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No posts yet
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
        
        <TabsContent value="replies" className="mt-4">
          <div className="text-center text-muted-foreground py-8">
            Replies will be shown here
          </div>
        </TabsContent>
        
        <TabsContent value="media" className="mt-4">
          <div className="text-center text-muted-foreground py-8">
            Media posts will be shown here
          </div>
        </TabsContent>
        
        <TabsContent value="likes" className="mt-4">
          <div className="text-center text-muted-foreground py-8">
            Liked posts will be shown here
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
