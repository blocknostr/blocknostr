
import { useCallback, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { ProfileAvatar } from './ProfileAvatar';
import { ProfileBanner } from './ProfileBanner';
import { ProfileSkeleton } from './ProfileSkeleton';
import { nostrService } from '@/lib/nostr';
import { formatDistanceToNow } from 'date-fns';

interface ProfileHeaderProps {
  profileData: {
    name?: string;
    display_name?: string;
    picture?: string;
    banner?: string;
    about?: string;
    nip05?: string;
    website?: string;
    lud16?: string;
  };
  npub: string;
  isCurrentUser: boolean;
  isLoading: boolean;
}

const ProfileHeader = ({ 
  profileData, 
  npub,
  isCurrentUser, 
  isLoading 
}: ProfileHeaderProps) => {
  const [accountAge, setAccountAge] = useState<string | null>(null);
  const [loadingAge, setLoadingAge] = useState(false);
  
  // Fetch account creation date
  useEffect(() => {
    const fetchAccountAge = async () => {
      if (!npub) return;
      
      try {
        setLoadingAge(true);
        const hexPubkey = nostrService.getHexFromNpub(npub);
        const creationTimestamp = await nostrService.getAccountCreationDate(hexPubkey);
        
        if (creationTimestamp) {
          const date = new Date(creationTimestamp * 1000);
          setAccountAge(formatDistanceToNow(date, { addSuffix: true }));
        } else {
          setAccountAge('Unknown');
        }
      } catch (error) {
        console.error('Error fetching account age:', error);
        setAccountAge('Unknown');
      } finally {
        setLoadingAge(false);
      }
    };
    
    fetchAccountAge();
  }, [npub]);

  const handleEditProfile = useCallback(() => {
    // This would open a profile edit modal
    console.log('Edit profile clicked');
  }, []);

  if (isLoading && !profileData) {
    return <ProfileSkeleton />;
  }

  const displayName = profileData?.display_name || profileData?.name || 'Anonymous';

  return (
    <div className="relative">
      <ProfileBanner 
        bannerUrl={profileData?.banner}
      />
      
      <div className="relative px-4 pb-4">
        <div className="flex justify-between items-start">
          <ProfileAvatar 
            avatarUrl={profileData?.picture} 
            displayName={displayName} 
            size="lg"
          />
          
          {isCurrentUser && (
            <Button 
              onClick={handleEditProfile} 
              size="sm" 
              className="mt-4"
              variant="outline"
            >
              <Pencil className="h-4 w-4 mr-2" /> Edit Profile
            </Button>
          )}
        </div>
        
        <div className="mt-4">
          <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
          
          {profileData?.name && profileData.name !== profileData.display_name && (
            <p className="text-muted-foreground">@{profileData.name}</p>
          )}
          
          {profileData?.nip05 && (
            <p className="text-sm text-muted-foreground mt-1">
              ✓ {profileData.nip05}
            </p>
          )}
          
          {accountAge && (
            <p className="text-sm text-muted-foreground mt-2">
              Joined {accountAge}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
