
import { useState, useEffect, useCallback } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProfileHeaderProps {
  profileData: any | null;
  npub: string;
  isCurrentUser: boolean;
  isLoading: boolean;
  onProfileUpdated: () => Promise<void>;
}

const ProfileHeader = ({ 
  profileData, 
  npub, 
  isCurrentUser, 
  isLoading,
  onProfileUpdated 
}: ProfileHeaderProps) => {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profile, setProfile] = useState(profileData);
  
  // Update local state when profileData prop changes
  useEffect(() => {
    setProfile(profileData);
  }, [profileData]);
  
  const pubkeyHex = npub.startsWith('npub1') ? nostrService.getHexFromNpub(npub) : npub;
  
  const {
    nip05Verified,
    verifyingNip05,
    xVerified,
    xVerifiedInfo,
    shortNpub,
    creationDate
  } = useProfileHeader(profile, npub, pubkeyHex);
  
  const displayName = profile?.display_name || profile?.name || shortNpub;
  const username = profile?.name || shortNpub;
  
  const handleProfileUpdated = useCallback(async () => {
    await onProfileUpdated();
  }, [onProfileUpdated]);
  
  return (
    <div className="mb-6">
      {/* Banner */}
      <ProfileBanner bannerUrl={profile?.banner} isLoading={isLoading} />
      
      {/* Profile info */}
      <Card className="border-none shadow-lg relative -mt-5">
        <CardContent className="pt-6 relative">
          <ProfileAvatar 
            pictureUrl={profile?.picture}
            displayName={displayName}
            isLoading={isLoading}
          />
          
          <div className="mt-16 md:mt-20">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-7 w-40" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ) : (
                <div>
                  <ProfileName
                    displayName={displayName}
                    username={username}
                    nip05={profile?.nip05}
                    nip05Verified={nip05Verified}
                  />
                  
                  <ProfileIdentity 
                    npub={npub}
                    pubkeyHex={pubkeyHex}
                    shortNpub={shortNpub}
                  />
                </div>
              )}
              
              <ProfileActions
                isCurrentUser={isCurrentUser}
                onEditProfile={() => setIsEditProfileOpen(true)}
                pubkeyHex={pubkeyHex}
                isLoading={isLoading}
              />
            </div>
            
            {isLoading ? (
              <div className="my-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : profile?.about ? (
              <ScrollArea className="my-4 max-h-32">
                <p className="whitespace-pre-wrap">{profile.about}</p>
              </ScrollArea>
            ) : null}
            
            {isLoading ? (
              <div className="flex gap-2 mt-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
              </div>
            ) : (
              <ProfileLinks
                website={profile?.website}
                twitter={profile?.twitter}
                nip05={profile?.nip05}
                nip05Verified={nip05Verified}
                xVerified={xVerified}
                xVerifiedInfo={xVerifiedInfo}
                creationDate={creationDate}
              />
            )}
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
