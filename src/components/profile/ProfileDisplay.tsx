import { useState, useEffect } from "react";
import { useNostr } from "@/contexts/NostrContext";
import MainLayout from "@/layouts/MainLayout";
// import NoteFeed from "@/components/feed/NoteFeed"; // Commented out as NoteFeed.tsx is missing
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Link as RouterLink } from "react-router-dom";
import { Link, User, Edit, CheckCircle, Settings, AlertTriangle, Zap } from "lucide-react"; // Added Zap for lud16
import { Skeleton } from "@/components/ui/skeleton";
import EditProfileDialog from "@/components/profile/EditProfileDialog";
import { nip19 } from "nostr-tools";

const ProfileDisplay = () => {
  const { isAuthenticated, profile, publicKey, logout, isLoading: isProfileLoading } = useNostr();
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  if (isProfileLoading) {
    return (
      <MainLayout>
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
      </MainLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please login to view your profile</h1>
          <Button asChild>
            <a href="/">Go to Login</a>
          </Button>
        </div>
      </div>
    );
  }

  const npub = profile?.npub || (publicKey ? nip19.npubEncode(publicKey) : null);
  const displayName = profile?.displayName || profile?.name || "Anonymous";

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <div className="space-x-2">
          <Button variant="outline" asChild>
            <RouterLink to="/settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </RouterLink>
          </Button>
          <Button variant="outline" onClick={logout}>Logout</Button>
        </div>
      </div>

      <div className="space-y-4">
          <>
            {/* Banner */}
            <div 
              className="h-32 rounded-lg bg-cover bg-center" 
              style={{ 
                backgroundImage: profile?.banner ? `url(${profile.banner})` : 'linear-gradient(90deg, var(--nostr-primary) 0%, var(--nostr-secondary) 100%)' 
              }} 
            />

            {/* Profile info */}
            <div className="flex items-start justify-between">
              <div className="flex space-x-4">
                <div className="h-24 w-24 rounded-full -mt-12 border-4 border-background overflow-hidden bg-muted">
                  {profile?.picture ? (
                    <img 
                      src={profile.picture} 
                      alt={displayName} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-full w-full p-4 text-muted-foreground" />
                  )}
                </div>
                <div className="pt-2">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold">{displayName}</h1>
                    {profile?.nip05 && (
                      <Badge 
                        variant={profile.nip05Verified === undefined ? "outline" : profile.nip05Verified ? "secondary" : "destructive"} 
                        className="flex items-center gap-1"
                        title={profile.nip05Verified === undefined ? "NIP-05 Verification Pending" : profile.nip05Verified ? "NIP-05 Verified" : "NIP-05 Verification Failed"}
                      >
                        {profile.nip05Verified === true && <CheckCircle className="h-3 w-3" />}
                        {profile.nip05Verified === false && <AlertTriangle className="h-3 w-3" />}
                        <span>{profile.nip05}</span>
                      </Badge>
                    )}
                  </div>
                  {profile?.name && profile?.name !== displayName && (
                    <p className="text-sm text-muted-foreground">@{profile.name}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{npub ? `${npub.substring(0, 8)}...${npub.substring(npub.length - 4)}` : ""}</p>
                </div>
              </div>
              <Button onClick={() => setEditProfileOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>

            {/* Bio */}
            <p className="text-sm">{profile?.about || "No bio yet."}</p>

            {/* Profile metadata */}
            <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-muted-foreground">
              {profile?.website && (
                <div className="flex items-center">
                  <Link className="h-4 w-4 mr-1" />
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {profile?.lud16 && (
                <div className="flex items-center">
                  <Zap className="h-4 w-4 mr-1" /> {/* Changed icon to Zap */}
                  <span>{profile.lud16}</span>
                </div>
              )}
            </div>

            {/* Posts/Likes tabs - Commented out as NoteFeed.tsx is missing
            <Tabs defaultValue="posts" className="w-full mt-6">
              <TabsList className="w-full">
                <TabsTrigger value="posts" className="flex-1">Posts</TabsTrigger>
                <TabsTrigger value="replies" className="flex-1">Replies</TabsTrigger>
                <TabsTrigger value="media" className="flex-1">Media</TabsTrigger>
                <TabsTrigger value="likes" className="flex-1">Likes</TabsTrigger>
              </TabsList>
              <TabsContent value="posts" className="mt-4">
                {publicKey && <NoteFeed pubkey={publicKey} feedType="posts" />}
              </TabsContent>
              <TabsContent value="replies" className="mt-4">
                {publicKey && <NoteFeed pubkey={publicKey} feedType="replies" />}
              </TabsContent>
              <TabsContent value="media" className="mt-4">
                {publicKey && <NoteFeed pubkey={publicKey} feedType="media" />}
              </TabsContent>
              <TabsContent value="likes" className="mt-4">
                {publicKey && <NoteFeed pubkey={publicKey} feedType="likes" />}
              </TabsContent>
            </Tabs>
            */}
          </>
      </div>
      
      <EditProfileDialog
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
      />
    </MainLayout>
  );
};

export default ProfileDisplay;
