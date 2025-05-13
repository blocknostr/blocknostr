
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { nostrService } from "@/lib/nostr";
import Sidebar from "@/components/Sidebar";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileStats from "@/components/profile/ProfileStats";
import ProfileLoading from "@/components/profile/ProfileLoading";
import ProfileNotFound from "@/components/profile/ProfileNotFound";
import ProfileTabs from "@/components/profile/ProfileTabs";
import { useProfileService } from "@/hooks/useProfileService";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRelays } from "@/hooks/useRelays";

const ProfilePage = () => {
  const { npub } = useParams<{ npub: string }>();
  const navigate = useNavigate();
  const currentUserPubkey = nostrService.publicKey;
  
  // Connect to relays first for better profile loading
  const { connectToRelays, connectionStatus } = useRelays();
  
  useEffect(() => {
    // Connect to relays when component mounts
    connectToRelays().catch(err => 
      console.error("Failed to connect to relays:", err)
    );
  }, [connectToRelays]);
  
  // Use our simplified profile service
  const {
    profileData,
    loading,
    error,
    refreshing,
    refreshProfile
  } = useProfileService({ npub, currentUserPubkey });
  
  // Extract all necessary data
  const {
    metadata,
    posts,
    media,
    reposts,
    replies,
    followers,
    following,
    relays,
    reactions,
    referencedEvents,
    originalPostProfiles,
    isCurrentUser,
  } = profileData;
  
  // Redirect to current user's profile if no npub is provided
  useEffect(() => {
    if (!npub && currentUserPubkey) {
      const formattedPubkey = nostrService.formatPubkey(currentUserPubkey);
      navigate(`/profile/${formattedPubkey}`, { replace: true });
    }
  }, [npub, currentUserPubkey, navigate]);
  
  if (loading) {
    return <ProfileLoading />;
  }
  
  // Calculate connection status
  const connectedRelayCount = relays?.filter(r => r.status === 'connected').length || 0;
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-0 md:ml-64">
        <header className="sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center justify-between h-14 px-4">
            <h1 className="font-semibold">Profile</h1>
            
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
                onClick={refreshProfile}
                disabled={refreshing}
                className="text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </header>
        
        <div className="max-w-3xl mx-auto px-4 py-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                <Button 
                  variant="link" 
                  className="p-0 h-auto ml-2" 
                  onClick={refreshProfile}
                >
                  Try again
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {connectionStatus !== 'connected' && !metadata && (
            <Alert variant="warning" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Connecting to relays... This may take a moment.
                <Button 
                  variant="link" 
                  className="p-0 h-auto ml-2" 
                  onClick={() => connectToRelays()}
                >
                  Retry connection
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {metadata ? (
            <>
              <ProfileHeader 
                profileData={metadata}
                npub={npub || nostrService.formatPubkey(currentUserPubkey || '')}
                isCurrentUser={isCurrentUser}
              />
              
              <ProfileStats 
                followers={followers}
                following={following}
                postsCount={posts.length + reposts.length}
                currentUserPubkey={currentUserPubkey}
                isCurrentUser={isCurrentUser}
                relays={relays}
                onRelaysChange={(updatedRelays) => {
                  // This would now be handled via profileDataService
                  console.log('Relay preferences updated:', updatedRelays);
                }}
                userNpub={npub}
                onRefresh={refreshProfile}
                isLoading={refreshing}
              />
              
              <ProfileTabs 
                events={posts}
                media={media}
                reposts={reposts}
                profileData={metadata}
                originalPostProfiles={originalPostProfiles}
                replies={replies}
                reactions={reactions}
                referencedEvents={referencedEvents}
              />
              
              {posts.length === 0 && reposts.length === 0 && !refreshing && (
                <div className="text-center py-8 text-muted-foreground">
                  {isCurrentUser ? (
                    <p>You haven't posted anything yet.</p>
                  ) : (
                    <p>This user hasn't posted anything yet.</p>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="mt-4"
                    onClick={refreshProfile}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              )}
            </>
          ) : (
            <ProfileNotFound />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
