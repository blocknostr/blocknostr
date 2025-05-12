
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { nostrService } from "@/lib/nostr";
import Sidebar from "@/components/Sidebar";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileStats from "@/components/profile/ProfileStats";
import ProfileLoading from "@/components/profile/ProfileLoading";
import ProfileNotFound from "@/components/profile/ProfileNotFound";
import ProfileTabs from "@/components/profile/ProfileTabs";
import { useProfileData } from "@/hooks/useProfileData";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEnhancedRelayConnection } from "@/hooks/profile/useEnhancedRelayConnection"; 
import { relaySelector } from "@/lib/nostr/relay/selection/relay-selector";
import { retry } from "@/lib/utils/retry";

const ProfilePage = () => {
  const { npub } = useParams<{ npub: string }>();
  const navigate = useNavigate();
  const currentUserPubkey = nostrService.publicKey;
  const [refreshing, setRefreshing] = useState(false);
  
  // Get the hex pubkey for the profile
  const hexPubkey = npub ? nostrService.getHexFromNpub(npub) : currentUserPubkey;
  
  // Use our enhanced relay connection hook
  const { 
    relays, 
    isConnecting, 
    connectToRelays, 
    refreshRelays 
  } = useEnhancedRelayConnection(hexPubkey);
  
  // Use our custom hook to manage profile data and state
  const {
    profileData,
    events,
    replies,
    media,
    reposts,
    loading,
    error,
    setRelays,
    followers,
    following,
    originalPostProfiles,
    isCurrentUser,
    reactions,
    referencedEvents,
    refreshProfile
  } = useProfileData({ npub, currentUserPubkey });
  
  // Handle connection to relays before loading data using smart selection
  useEffect(() => {
    if (loading && !isConnecting) {
      connectToRelays();
    }
  }, [loading, isConnecting, connectToRelays]);
  
  // Handle manual refresh with improved feedback and relay selection
  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    toast.loading("Refreshing profile data...");
    
    try {
      // First ensure we have optimal relay connections
      await connectToRelays();
      
      // Use retry utility with exponential backoff for more resilient profile refresh
      await retry(
        async () => {
          // Get best relays for read operations
          const readRelays = relaySelector.selectBestRelays(
            relays.map(r => r.url),
            { operation: 'read', count: 5 }
          );
          
          // Add these read-optimized relays
          if (readRelays.length > 0) {
            await nostrService.addMultipleRelays(readRelays);
          }
          
          // Add popular relays as fallback
          await nostrService.addMultipleRelays([
            "wss://relay.damus.io", 
            "wss://nos.lol", 
            "wss://relay.nostr.band",
            "wss://relay.snort.social"
          ]);
          
          // Refresh relays status
          refreshRelays();
          
          // Try to refresh profile data
          const result = await refreshProfile();
          if (!result) {
            throw new Error("Failed to fetch profile data");
          }
          return result;
        },
        {
          maxAttempts: 2,
          baseDelay: 2000,
          onRetry: () => {
            toast.info("Retrying profile refresh...");
          }
        }
      );
      
      toast.success("Profile refreshed");
    } catch (err) {
      console.error("Error refreshing profile:", err);
      toast.error("Failed to refresh profile");
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, connectToRelays, refreshRelays, refreshProfile, relays]);
  
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
  const connectedRelayCount = relays.filter(r => r.status === 'connected').length;
  
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
                onClick={handleRefresh}
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
                  onClick={handleRefresh}
                >
                  Try again
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {profileData ? (
            <>
              <ProfileHeader 
                profileData={profileData}
                npub={npub || nostrService.formatPubkey(currentUserPubkey || '')}
                isCurrentUser={isCurrentUser}
              />
              
              <ProfileStats 
                followers={followers}
                following={following}
                postsCount={events.length + reposts.length}
                currentUserPubkey={currentUserPubkey}
                isCurrentUser={isCurrentUser}
                relays={relays}
                onRelaysChange={setRelays}
                userNpub={npub}
                onRefresh={handleRefresh}
                isLoading={refreshing}
              />
              
              <ProfileTabs 
                events={events}
                media={media}
                reposts={reposts}
                profileData={profileData}
                originalPostProfiles={originalPostProfiles}
                replies={replies}
                reactions={reactions}
                referencedEvents={referencedEvents}
              />
              
              {events.length === 0 && reposts.length === 0 && !refreshing && (
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
                    onClick={handleRefresh}
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
