
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { nostrService } from "@/lib/nostr";
import Sidebar from "@/components/Sidebar";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileStats from "@/components/profile/ProfileStats";
import { ProfileContent } from "@/components/profile/ProfileContent";
import ProfileLoading from "@/components/profile/ProfileLoading";
import ProfileError from "@/components/profile/ProfileError";
import { useEnhancedProfileLoading } from "@/hooks/profile/useEnhancedProfileLoading";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { adaptedNostrService } from "@/lib/nostr/nostr-adapter";
import { relaySelector } from "@/lib/nostr/relay/selection/relay-selector";

const ProfilePage = () => {
  const { npub } = useParams<{ npub: string }>();
  const navigate = useNavigate();
  const currentUserPubkey = nostrService.publicKey;
  const [refreshing, setRefreshing] = useState(false);
  
  // Use our enhanced profile loading hook
  const {
    profileData,
    events,
    followers,
    following,
    metadataLoading,
    postsLoading,
    relationsLoading,
    loading,
    error,
    reload,
    hexPubkey,
    isCurrentUser,
    metadataError
  } = useEnhancedProfileLoading({
    npub,
    currentUserPubkey
  });
  
  // Get relay stats for UI
  const [relayStats, setRelayStats] = useState({ connected: 0, total: 0 });
  
  // Update relay stats periodically
  useEffect(() => {
    const updateRelayStats = () => {
      const relays = adaptedNostrService.getRelayStatus();
      setRelayStats({
        connected: relays.filter(r => r.status === 'connected').length,
        total: relays.length
      });
    };
    
    updateRelayStats();
    const intervalId = setInterval(updateRelayStats, 5000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  // Handle manual refresh with improved feedback
  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    toast.loading("Refreshing profile data...");
    
    try {
      const success = await reload();
      
      if (success) {
        toast.success("Profile refreshed");
      } else {
        toast.error("Failed to refresh profile");
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      toast.error('Failed to refresh profile');
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, reload]);
  
  // Redirect to current user's profile if no npub is provided
  useEffect(() => {
    if (!npub && currentUserPubkey) {
      const formattedPubkey = nostrService.formatPubkey(currentUserPubkey);
      navigate(`/profile/${formattedPubkey}`, { replace: true });
    }
  }, [npub, currentUserPubkey, navigate]);
  
  // If we're in a completely loading state, show loading skeleton
  if (loading && !profileData) {
    return <ProfileLoading />;
  }
  
  // Show error if we couldn't load profile metadata
  if (metadataError && !profileData) {
    return <ProfileError error={metadataError} onRetry={handleRefresh} />;
  }
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-0 md:ml-64">
        <header className="sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center justify-between h-14 px-4">
            <h1 className="font-semibold">Profile</h1>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                {relayStats.connected > 0 ? (
                  <Wifi className="h-3 w-3 text-green-500" />
                ) : (
                  <WifiOff className="h-3 w-3 text-red-500" />
                )}
                <span>{relayStats.connected}/{relayStats.total} relays</span>
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
          
          {/* Progressive loading profile header - always show if we have profileData */}
          {profileData && (
            <>
              <ProfileHeader 
                profileData={profileData}
                npub={npub || nostrService.formatPubkey(currentUserPubkey || '')}
                isCurrentUser={isCurrentUser}
                isLoading={metadataLoading}
              />
              
              <ProfileStats 
                followers={followers}
                following={following}
                postsCount={events.length}
                currentUserPubkey={currentUserPubkey}
                isCurrentUser={isCurrentUser}
                relays={adaptedNostrService.getRelayStatus()}
                onRefresh={handleRefresh}
                isLoading={refreshing || relationsLoading}
              />
              
              <ProfileContent
                events={events}
                profileData={profileData}
                isLoading={postsLoading}
                isEmpty={events.length === 0 && !postsLoading}
                onRefresh={handleRefresh}
                isCurrentUser={isCurrentUser}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
