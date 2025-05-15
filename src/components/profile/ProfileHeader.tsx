import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PencilIcon, LinkIcon, UserCheckIcon, UserMinusIcon, UserPlusIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { nostrService, formatPubkey } from '@/lib/nostr';
import { toast } from 'sonner';
import { copyToClipboard } from '@/lib/utils/clipboard';

interface ProfileHeaderProps {
  profile: any;
  pubkey: string;
  isCurrentUser: boolean;
  isFollowing: boolean;
  onFollow: () => Promise<void>;
  onUnfollow: () => Promise<void>;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  pubkey,
  isCurrentUser,
  isFollowing,
  onFollow,
  onUnfollow,
}) => {
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  
  const formattedPubkey = formatPubkey(pubkey);
  const displayName = profile?.display_name || profile?.name || formattedPubkey.substring(0, 10) + '...';
  const username = profile?.name ? `@${profile.name}` : formattedPubkey.substring(0, 10) + '...';
  const profileImage = profile?.picture || '/placeholder-avatar.png';
  const bannerImage = profile?.banner || '/placeholder-banner.jpg';
  const bio = profile?.about || '';
  
  const handleFollowToggle = async () => {
    if (isFollowLoading) return;
    
    try {
      setIsFollowLoading(true);
      
      if (isFollowing) {
        await onUnfollow();
        toast.success(`Unfollowed ${displayName}`);
      } else {
        await onFollow();
        toast.success(`Following ${displayName}`);
      }
    } catch (error) {
      console.error('Error toggling follow state:', error);
      toast.error(isFollowing ? 'Failed to unfollow' : 'Failed to follow');
    } finally {
      setIsFollowLoading(false);
    }
  };
  
  const handleCopyAddress = () => {
    copyToClipboard(pubkey);
    toast.success('Address copied to clipboard');
  };

  return (
    <div className="relative">
      {/* Banner Image */}
      <div className="relative h-32 overflow-hidden rounded-md">
        <img
          src={bannerImage}
          alt="Banner"
          className="absolute object-cover object-center w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
      </div>
      
      {/* Profile Content */}
      <div className="absolute left-4 bottom-0 flex items-end gap-4">
        {/* Profile Image */}
        <div className="relative -mb-12">
          <img
            src={profileImage}
            alt="Profile"
            className="rounded-full border-2 border-background w-24 h-24"
          />
        </div>
        
        {/* Profile Info */}
        <div className="text-white">
          <h2 className="text-lg font-semibold">{displayName}</h2>
          <p className="text-sm opacity-80">{username}</p>
        </div>
      </div>
      
      {/* Actions */}
      <div className="absolute right-4 top-4 flex gap-2">
        {isCurrentUser ? (
          <Link to={`/profile/${pubkey}/edit`} className="inline-block">
            <Button variant="outline" className="flex items-center">
              <PencilIcon className="w-4 h-4 mr-1" />
              Edit Profile
            </Button>
          </Link>
        ) : (
          <Button 
            variant={isFollowing ? 'destructive' : 'outline'}
            onClick={handleFollowToggle}
            disabled={isFollowLoading}
          >
            {isFollowing ? (
              <>
                <UserMinusIcon className="w-4 h-4 mr-1" />
                Unfollow
              </>
            ) : (
              <>
                <UserPlusIcon className="w-4 h-4 mr-1" />
                Follow
              </>
            )}
          </Button>
        )}
        
        <Button variant="secondary" onClick={handleCopyAddress}>
          <LinkIcon className="w-4 h-4 mr-1" />
          Copy Address
        </Button>
      </div>
      
      {/* Bio */}
      <div className="mt-4 px-4">
        <p className="text-sm text-muted-foreground">{bio}</p>
      </div>
    </div>
  );
};

export default ProfileHeader;
