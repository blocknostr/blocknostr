import { useEffect, useState, Suspense, lazy } from "react";
import { nostrService } from "@/lib/nostr";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { RefreshCw, Wifi, WifiOff, Settings, Users, Image, MessageSquare, Award } from "lucide-react";
import { useRelays } from "@/hooks/useRelays";
import { useProfileService } from "@/hooks/useProfileService";
import { ErrorBoundary } from "@/components/ui/error-boundary";

// Lazy-loaded components for better performance
const MyCubeHeader = lazy(() => import("@/components/mycube/MyCubeHeader"));
const MyCubeStats = lazy(() => import("@/components/mycube/MyCubeStats"));
const MyCubePosts = lazy(() => import("@/components/mycube/MyCubePosts"));
const MyCubeMedia = lazy(() => import("@/components/mycube/MyCubeMedia"));
const MyCubeNetwork = lazy(() => import("@/components/mycube/MyCubeNetwork"));

// Loading placeholders
const HeaderSkeleton = () => (
  <div className="mb-6 space-y-3">
    <div className="h-40 w-full bg-muted rounded-lg"></div>
    <div className="flex justify-between items-end">
      <div className="-mt-12 relative">
        <div className="h-24 w-24 rounded-full bg-muted border-4 border-background"></div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-16 w-full" />
    </div>
  </div>
);

const MyCubePage = () => {
  // Get current user's pubkey - make sure we handle cases where it might be undefined
  const currentUserPubkey = nostrService?.publicKey || null;
  const { connectToRelays, connectionStatus } = useRelays();
  const [activeTab, setActiveTab] = useState("posts");
  
  useEffect(() => {
    // Connect to relays when component mounts
    if (connectToRelays) {
      connectToRelays().catch(err => 
        console.error("Failed to connect to relays:", err)
      );
    }
  }, [connectToRelays]);
  
  // Log the current user's pubkey to help debug
  useEffect(() => {
    console.log("Current user pubkey:", currentUserPubkey);
  }, [currentUserPubkey]);
  
  // Initialize profileData with default values - include all required fields
  const defaultProfileData = {
    metadata: {},
    posts: [],
    media: [],
    reposts: [],
    replies: [],
    reactions: [],
    referencedEvents: {},
    followers: [],
    following: [],
    relays: [],
    originalPostProfiles: {},
    isCurrentUser: true,
    hexPubkey: null
  };
  
  // Use profileService with current user's pubkey
  const {
    profileData = defaultProfileData,
    loading = true,
    error,
    refreshing = false,
    refreshProfile = () => {
      console.log("Attempting to refresh profile");
      toast.info("Refreshing profile data...");
    }
  } = useProfileService({ 
    npub: currentUserPubkey ? nostrService.getNpubFromHex(currentUserPubkey) : undefined, 
    currentUserPubkey 
  }) || {};

  // Extract relevant profile data with fallbacks
  const {
    metadata = {},
    posts = [],
    media = [],
    followers = [],
    following = [],
    relays = [],
    isCurrentUser = true,
  } = profileData || defaultProfileData;

  // Handle the case where user is not logged in
  if (!currentUserPubkey) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Login Required</h2>
            <p className="mb-6 text-muted-foreground">
              You need to login with your Nostr account to access MyCube.
            </p>
            <Button onClick={() => toast.info("Login functionality would be implemented here")}>
              Login with Nostr
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Add more error handling
  if (error) {
    console.error("Profile service error:", error);
    return (
      <div className="max-w-4xl mx-auto px-4 py-4">
        <PageHeader title="MyCube" />
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Error Loading Profile</h2>
          <p className="text-muted-foreground mb-4">
            There was an error loading your profile data. Please try refreshing.
          </p>
          <Button onClick={() => {
            if (refreshProfile) {
              refreshProfile();
            } else {
              toast.info("Refresh function not available");
            }
          }}>Refresh</Button>
        </Card>
      </div>
    );
  }

  const connectedRelayCount = relays?.filter(r => r.status === 'connected').length || 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <PageHeader
        title="MyCube"
        rightContent={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {connectedRelayCount > 0 ? (
                <Wifi className="h-3 w-3 text-green-500" />
              ) : (
                <WifiOff className="h-3 w-3 text-red-500" />
              )}
              <span>{connectedRelayCount} relays</span>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => refreshProfile()}
              disabled={refreshing}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
      />

      <ErrorBoundary>
        <Suspense fallback={<HeaderSkeleton />}>
          {loading ? (
            <HeaderSkeleton />
          ) : (
            <MyCubeHeader
              profileData={metadata}
              isCurrentUser={isCurrentUser}
              onProfileUpdated={refreshProfile}
            />
          )}
        </Suspense>
      </ErrorBoundary>

      <div className="mt-6">
        <ErrorBoundary>
          <Suspense fallback={<Skeleton className="h-24 w-full" />}>
            <MyCubeStats
              postsCount={posts?.length || 0}
              followersCount={followers?.length || 0}
              followingCount={following?.length || 0}
              relaysCount={relays?.length || 0}
            />
          </Suspense>
        </ErrorBoundary>
      </div>

      <div className="mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-2">
            <TabsList>
              <TabsTrigger value="posts" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Posts</span>
                <Badge variant="outline" className="ml-1">{posts?.length || 0}</Badge>
              </TabsTrigger>
              <TabsTrigger value="media" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                <span className="hidden sm:inline">Media</span>
                <Badge variant="outline" className="ml-1">{media?.length || 0}</Badge>
              </TabsTrigger>
              <TabsTrigger value="network" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Network</span>
              </TabsTrigger>
              <TabsTrigger value="achievements" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                <span className="hidden sm:inline">Achievements</span>
              </TabsTrigger>
            </TabsList>
            
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Preferences</span>
            </Button>
          </div>

          <TabsContent value="posts" className="mt-4">
            <ErrorBoundary>
              <Suspense fallback={<div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>}>
                <MyCubePosts posts={posts || []} loading={loading} refreshing={refreshing} />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="media" className="mt-4">
            <ErrorBoundary>
              <Suspense fallback={<div className="grid grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-square w-full" />)}</div>}>
                <MyCubeMedia media={media || []} loading={loading} />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="network" className="mt-4">
            <ErrorBoundary>
              <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                <MyCubeNetwork 
                  followers={followers || []}
                  following={following || []}
                  relays={relays || []}
                />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="achievements" className="mt-4">
            <Card>
              <CardContent className="py-8 text-center">
                <h3 className="text-xl font-medium mb-4">Achievements</h3>
                <p className="text-muted-foreground">Track your Nostr milestones and achievements.</p>
                <p className="text-muted-foreground mt-2">Coming soon!</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyCubePage;
