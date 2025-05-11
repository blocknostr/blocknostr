
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { nostrService } from "@/lib/nostr";
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
    isCurrentUser
  } = useProfileData({ npub, currentUserPubkey });
  
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
          />
          
          <ProfileTabs 
            events={events}
            media={media}
            reposts={reposts}
            profileData={profileData}
            originalPostProfiles={originalPostProfiles}
          />
        </>
      ) : (
        <ProfileNotFound />
      )}
    </div>
  );
};

export default ProfilePage;
