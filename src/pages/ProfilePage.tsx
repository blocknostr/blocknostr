
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
import { RefreshCw } from "lucide-react";

const ProfilePage = () => {
  const { npub } = useParams<{ npub: string }>();
  const navigate = useNavigate();
  const currentUserPubkey = nostrService.publicKey;
  const [refreshing, setRefreshing] = useState(false);
  
  // Use our custom hook to manage profile data and state
  const {
    profileData,
    events,
    replies,
    media,
    reposts,
    loading,
    relays,
    setRelays,
    followers,
    following,
    originalPostProfiles,
    isCurrentUser,
    reactions,
    referencedEvents,
    refreshProfile
  } = useProfileData({ npub, currentUserPubkey });
  
  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    if (refreshing) return;
    
    setRefreshing(true);
    toast.info("Refreshing profile data...");
    
    refreshProfile().then(() => {
      toast.success("Profile refreshed");
    }).catch(err => {
      console.error("Error refreshing profile:", err);
      toast.error("Failed to refresh profile");
    }).finally(() => {
      setRefreshing(false);
    });
  }, [refreshing, refreshProfile]);
  
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
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-0 md:ml-64">
        <header className="sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center justify-between h-14 px-4">
            <h1 className="font-semibold">Profile</h1>
            
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
        </header>
        
        <div className="max-w-3xl mx-auto px-4 py-4">
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
