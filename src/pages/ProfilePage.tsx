
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { nostrService } from "@/lib/nostr";
import Sidebar from "@/components/Sidebar";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileStats from "@/components/profile/ProfileStats";
import ProfileLoading from "@/components/profile/ProfileLoading";
import ProfileNotFound from "@/components/profile/ProfileNotFound";
import ProfileTabs from "@/components/profile/ProfileTabs";
import { useProfileData } from "@/hooks/useProfileData";

const ProfilePage = () => {
  const { npub } = useParams<{ npub: string }>();
  const navigate = useNavigate();
  const currentUserPubkey = nostrService.publicKey;
  
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
    refreshProfile
  } = useProfileData({ npub, currentUserPubkey });
  
  // Redirect to current user's profile if no npub is provided
  useEffect(() => {
    if (!npub && currentUserPubkey) {
      const formattedPubkey = nostrService.formatPubkey(currentUserPubkey);
      navigate(`/profile/${formattedPubkey}`, { replace: true });
    }
  }, [npub, currentUserPubkey, navigate]);
  
  if (loading && !profileData) {
    return <ProfileLoading />;
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
          {profileData ? (
            <>
              <ProfileHeader 
                profileData={profileData}
                npub={npub || nostrService.formatPubkey(currentUserPubkey || '')}
                isCurrentUser={isCurrentUser}
                isLoading={loading}
                onProfileUpdated={refreshProfile}
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
                isLoading={loading}
              />
              
              <ProfileTabs 
                events={events}
                media={media}
                reposts={reposts}
                profileData={profileData}
                originalPostProfiles={originalPostProfiles}
                isLoading={loading}
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
