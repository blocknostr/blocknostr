
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { nostrService } from "@/lib/nostr";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileStats from "@/components/profile/ProfileStats";
import ProfileRelays from "@/components/profile/ProfileRelays";
import ProfileAlephiumConnect from '@/components/profile/ProfileAlephiumConnect';
import PostList from "@/components/post/PostList";
import { Relay } from "@/lib/nostr";

const ProfilePage = () => {
  const { pubkey } = useParams();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [following, setFollowing] = useState<string[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [postsCount, setPostsCount] = useState(0);
  const [relays, setRelays] = useState<Relay[]>([]);
  
  // Determine if this is the current user's profile
  const currentUserPubkey = nostrService.publicKey;
  const isCurrentUser = !pubkey || pubkey === currentUserPubkey;
  
  // Format the pubkey for display
  const formattedNpub = pubkey 
    ? nostrService.formatPubkey(pubkey) 
    : currentUserPubkey 
      ? nostrService.formatPubkey(currentUserPubkey)
      : '';
  
  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      
      try {
        // If no pubkey is provided and user is logged in, use current user's pubkey
        const targetPubkey = pubkey || currentUserPubkey;
        
        if (!targetPubkey) {
          // If no pubkey and not logged in, redirect to home
          navigate('/');
          return;
        }
        
        // Fetch profile data
        const profile = await nostrService.getUserProfile(targetPubkey);
        setProfileData(profile);
        
        // Since getFollowing doesn't exist, let's use the following array directly from nostrService
        // if it's the current user, or an empty array for other users for now
        const userFollowing = isCurrentUser && nostrService.following ? 
                             nostrService.following : [];
        setFollowing(userFollowing);
        
        // For followers, as getFollowers doesn't exist, we'll set an empty array for now
        // In a real implementation, we'd need to query relays for users who follow this pubkey
        setFollowers([]);
        
        // For post count, since getPostCount doesn't exist, we'll just set it to 0 for now
        // In a real implementation, we'd count posts from the relays
        setPostsCount(0);
        
        // Fetch relays if current user
        if (isCurrentUser) {
          const userRelays = nostrService.getRelayStatus();
          setRelays(userRelays);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
  }, [pubkey, currentUserPubkey, isCurrentUser, navigate]);
  
  const handleOpenDM = () => {
    if (pubkey) {
      navigate(`/messages?to=${pubkey}`);
    }
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
        npub={formattedNpub}
        isCurrentUser={isCurrentUser}
        onMessage={handleOpenDM}
      />
      
      <ProfileAlephiumConnect 
        isCurrentUser={isCurrentUser} 
        nostrPubkey={pubkey || ''} 
      />
      
      <ProfileStats
        following={following}
        followers={followers}
        postsCount={postsCount}
        currentUserPubkey={currentUserPubkey}
        isCurrentUser={isCurrentUser}
        relays={relays}
        onRelaysChange={setRelays}
        userNpub={pubkey || currentUserPubkey || ''}
      />
      
      {isCurrentUser && (
        <ProfileRelays 
          relays={relays}
          onRelaysChange={setRelays}
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
          <PostList 
            filter={{ authors: [pubkey || currentUserPubkey || ''] }}
            emptyMessage="No posts yet"
          />
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
