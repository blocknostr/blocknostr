
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { nostrService } from "@/lib/nostr";
import Sidebar from "@/components/Sidebar";
import ProfileLoading from "@/components/profile/ProfileLoading";
import { useProfileData } from "@/hooks/useProfileData";
import { useEnhancedRelayConnection } from "@/hooks/profile/useEnhancedRelayConnection";
import { useProfilePageRefresh } from "@/hooks/profile/useProfilePageRefresh";
import { useEditProfileDialog } from "@/hooks/profile/useEditProfileDialog";
import ProfilePageHeader from "@/components/profile/page/ProfilePageHeader";
import ProfilePageContent from "@/components/profile/page/ProfilePageContent";
import EditProfileDialog from "@/components/profile/EditProfileDialog";

const ProfilePage: React.FC = () => {
  const { npub } = useParams<{ npub: string }>();
  const navigate = useNavigate();
  const currentUserPubkey = nostrService.publicKey;

  // Hex pubkey for viewing
  const hexPubkey = npub 
    ? nostrService.getHexFromNpub(npub) 
    : currentUserPubkey;

  // Handle edit profile dialog
  const { isEditOpen, setIsEditOpen, openEditProfile, handleProfileUpdated } = useEditProfileDialog();

  // Get relay connection status
  const { relays, isConnecting, connectToRelays, refreshRelays } =
    useEnhancedRelayConnection(hexPubkey!);

  // Get profile data
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
    refreshProfile,
  } = useProfileData({ npub, currentUserPubkey });

  // Handle refresh logic
  const { refreshing, handleRefresh } = useProfilePageRefresh(
    relays,
    connectToRelays,
    refreshRelays,
    refreshProfile
  );

  // Auto-connect when loading
  useEffect(() => {
    if (loading && !isConnecting) {
      connectToRelays();
    }
  }, [loading, isConnecting, connectToRelays]);

  // Redirect if no npub
  useEffect(() => {
    if (!npub && currentUserPubkey) {
      const formatted = nostrService.formatPubkey(currentUserPubkey);
      navigate(`/profile/${formatted}`, { replace: true });
    }
  }, [npub, currentUserPubkey, navigate]);

  if (loading) return <ProfileLoading />;

  const connectedRelayCount = relays.filter((r) => r.status === "connected").length;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex-1 ml-0 md:ml-64">
        <ProfilePageHeader
          isCurrentUser={isCurrentUser}
          connectedRelayCount={connectedRelayCount}
          refreshing={refreshing}
          handleRefresh={handleRefresh}
          openEditProfile={openEditProfile}
        />
        
        <ProfilePageContent
          profileData={profileData}
          error={error}
          events={events}
          media={media}
          reposts={reposts}
          replies={replies}
          reactions={reactions}
          referencedEvents={referencedEvents}
          followers={followers}
          following={following}
          relays={relays}
          originalPostProfiles={originalPostProfiles}
          isCurrentUser={isCurrentUser}
          currentUserPubkey={currentUserPubkey}
          npub={npub}
          refreshing={refreshing}
          handleRefresh={handleRefresh}
          setRelays={setRelays}
        />
      </div>

      {isCurrentUser && profileData && (
        <EditProfileDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          profileData={profileData}
          onProfileUpdated={() => handleProfileUpdated(handleRefresh)}
        />
      )}
    </div>
  );
};

export default ProfilePage;
