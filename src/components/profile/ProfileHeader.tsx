
// src/components/profile/ProfileHeader.tsx

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { nostrService } from "@/lib/nostr";
import EditProfileDialog from "./EditProfileDialog";
import ProfileBanner from "./header/ProfileBanner";
import ProfileAvatar from "./header/ProfileAvatar";
import ProfileName from "./header/ProfileName";
import ProfileActions from "./header/ProfileActions";
import ProfileIdentity from "./header/ProfileIdentity";
import ProfileLinks from "./header/ProfileLinks";
import { useProfileHeader } from "./header/useProfileHeader";

interface ProfileHeaderProps {
  profileData: any | null;
  npub: string;
  isCurrentUser: boolean;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profileData,
  npub,
  isCurrentUser,
}) => {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profile, setProfile] = useState(profileData);

  // Update local state when profileData prop changes
  useEffect(() => {
    setProfile(profileData);
  }, [profileData]);

  // Convert npub to hex if needed
  const pubkeyHex = npub.startsWith("npub1")
    ? nostrService.getHexFromNpub(npub)
    : npub;

  const {
    nip05Verified,
    verifyingNip05,
    xVerified,
    xVerifiedInfo,
    shortNpub,
    creationDate, // this is now a string from the hook
  } = useProfileHeader(profile, npub, pubkeyHex);

  // Create a Date object from the ISO string if it exists
  const creationDateObj = creationDate ? new Date(creationDate) : undefined;

  const displayName = profile?.display_name || profile?.name || shortNpub;
  const username = profile?.name || shortNpub;

  const handleProfileUpdated = async () => {
    if (!pubkeyHex) return;
    try {
      const freshProfile = await nostrService.getUserProfile(pubkeyHex);
      if (freshProfile) {
        setProfile(freshProfile);
      }
    } catch (err) {
      console.error("Error fetching updated profile:", err);
    }
  };

  return (
    <div className="mb-6">
      {/* Banner */}
      <ProfileBanner bannerUrl={profile?.banner} />

      {/* Profile info */}
      <Card className="border-none shadow-lg relative -mt-5">
        <CardContent className="pt-6 relative">
          <ProfileAvatar pictureUrl={profile?.picture} displayName={displayName} />

          <div className="mt-16 md:mt-20">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start">
              <div>
                <ProfileName
                  displayName={displayName}
                  username={username}
                  nip05={profile?.nip05}
                  nip05Verified={nip05Verified}
                />

                <ProfileIdentity npub={npub} pubkeyHex={pubkeyHex} shortNpub={shortNpub} />
              </div>

              <ProfileActions
                isCurrentUser={isCurrentUser}
                onEditProfile={() => setIsEditProfileOpen(true)}
                pubkeyHex={pubkeyHex}
              />
            </div>

            {profile?.about && (
              <p className="my-4 whitespace-pre-wrap">{profile.about}</p>
            )}

            <ProfileLinks
              website={profile?.website}
              twitter={profile?.twitter}
              nip05={profile?.nip05}
              nip05Verified={nip05Verified}
              xVerified={xVerified}
              xVerifiedInfo={xVerifiedInfo}
              creationDate={creationDateObj}
            />
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        open={isEditProfileOpen}
        onOpenChange={setIsEditProfileOpen}
        profileData={profile}
        onProfileUpdated={handleProfileUpdated}
      />
    </div>
  );
};

export default ProfileHeader;
