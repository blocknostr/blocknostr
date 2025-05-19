
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { nostrService } from '@/lib/nostr';
import { useBasicProfile } from '@/hooks/useBasicProfile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User, 
  Edit, 
  Link as LinkIcon, 
  Calendar, 
  MapPin, 
  CheckCircle2,
  Loader2
} from 'lucide-react';
import EditProfileDialog from '@/components/profile/EditProfileDialog';
import useProfilePosts from '@/hooks/profile/posts/useProfilePosts';
import UnifiedFeedTab from '@/components/profile/tabs/UnifiedFeedTab';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { getMediaUrlsFromEvent } from '@/lib/nostr/utils/media-extraction';

const ProfilePage = () => {
  const { npub } = useParams<{ npub: string }>();
  const navigate = useNavigate();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  // Profile data fetching
  const { profile, loading: profileLoading, error: profileError } = useBasicProfile(npub);
  
  // Convert npub to hex pubkey
  const hexPubkey = React.useMemo(() => {
    try {
      return npub ? nostrService.getHexFromNpub(npub) : undefined;
    } catch (e) {
      console.error('Invalid npub:', e);
      return undefined;
    }
  }, [npub]);
  
  // Check if this is the current user's profile
  const isCurrentUser = React.useMemo(() => {
    return hexPubkey === nostrService.publicKey;
  }, [hexPubkey]);
  
  // Fetch posts
  const { 
    events, 
    media, 
    loading: postsLoading, 
    error: postsError,
    refetch: refetchPosts 
  } = useProfilePosts({ hexPubkey });

  // Load more posts with infinite scroll
  const [displayLimit, setDisplayLimit] = useState(10);
  const loadMorePosts = useCallback(() => {
    setDisplayLimit(prev => prev + 10);
  }, []);
  
  // Set up infinite scroll
  const {
    loadMoreRef,
    loading: loadingMore,
    hasMore
  } = useInfiniteScroll(loadMorePosts, { 
    disabled: events.length <= displayLimit 
  });
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setDisplayLimit(10); // Reset pagination when changing tabs
  };
  
  // Refresh profile data when edit dialog is closed
  const handleProfileUpdate = () => {
    // Delay the refetch slightly to allow for relay updates
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // Redirect to login if no npub
  useEffect(() => {
    if (!npub) {
      navigate('/login');
    }
  }, [npub, navigate]);

  // Loading state
  const isLoading = profileLoading || !profile;

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {profileError ? (
        <div className="py-8 text-center text-destructive">
          <p className="text-lg">Error loading profile</p>
          <p className="text-sm">{profileError}</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <div className="flex items-start justify-between">
                <div className="flex space-x-4">
                  <Skeleton className="h-24 w-24 rounded-full -mt-12 border-4 border-background" />
                  <div className="space-y-2 pt-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-10 w-24" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ) : (
            <>
              {/* Banner */}
              <div 
                className="h-32 rounded-lg bg-cover bg-center" 
                style={{ 
                  backgroundImage: profile?.banner ? `url(${profile.banner})` : 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)' 
                }} 
              />

              {/* Profile info */}
              <div className="flex items-start justify-between">
                <div className="flex space-x-4">
                  <div className="h-24 w-24 rounded-full -mt-12 border-4 border-background overflow-hidden bg-muted">
                    {profile?.picture ? (
                      <img 
                        src={profile.picture} 
                        alt={profile.display_name || "Profile"} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-full w-full p-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="pt-2">
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-bold">{profile?.display_name || profile?.name || "Anonymous"}</h1>
                      {profile?.nip05 && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>{profile.nip05}</span>
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">@{profile?.name || npub?.substring(0, 8)}</p>
                  </div>
                </div>
                {isCurrentUser && (
                  <Button onClick={() => setEditProfileOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>

              {/* Bio */}
              <p className="text-sm">{profile?.about || "No bio yet"}</p>

              {/* Profile metadata */}
              <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-muted-foreground">
                {profile?.website && (
                  <div className="flex items-center">
                    <LinkIcon className="h-4 w-4 mr-1" />
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {profile.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                {profile?.created_at && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Joined {new Date(profile.created_at * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
                  </div>
                )}
                {profile?.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{profile.location}</span>
                  </div>
                )}
              </div>

              {/* Posts/Media/Likes tabs */}
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full mt-6">
                <TabsList className="w-full">
                  <TabsTrigger value="posts" className="flex-1">Posts</TabsTrigger>
                  <TabsTrigger value="media" className="flex-1">Media</TabsTrigger>
                </TabsList>
                
                <TabsContent value="posts" className="mt-4">
                  <UnifiedFeedTab 
                    loading={postsLoading}
                    loadingMore={loadingMore}
                    hasMore={hasMore}
                    feedItems={events.slice(0, displayLimit)}
                    profileData={profile}
                    loadMoreRef={loadMoreRef}
                  />
                </TabsContent>
                
                <TabsContent value="media" className="mt-4">
                  {media.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {media.slice(0, displayLimit).map((event) => (
                        <div key={event.id} className="aspect-square rounded-md overflow-hidden bg-muted">
                          <img 
                            src={getMediaUrlsFromEvent(event)[0]} 
                            alt="Media post" 
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                      {loadingMore && (
                        <div className="col-span-full flex justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      )}
                      <div ref={loadMoreRef} />
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No media posts yet</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
          
          {/* Edit Profile Dialog */}
          <EditProfileDialog
            open={editProfileOpen}
            onOpenChange={setEditProfileOpen}
            profile={profile}
            onProfileUpdate={handleProfileUpdate}
          />
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
