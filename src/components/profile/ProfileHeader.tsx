
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Link as LinkIcon, MapPin, Users, User, Network, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { isCurrentUser } from '@/lib/utils/pubkeyUtils';
import { nostrService } from '@/lib/nostr';
import FollowButton from '@/components/FollowButton';
import ProfileRelaysDialog from './ProfileRelaysDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Relay } from "@/lib/nostr";
import EditProfileDialog from './edit-profile/EditProfileDialog';

interface ProfileHeaderProps {
  profile: any;
  npub: string;
  hexPubkey: string;
  followers?: string[];
  following?: string[];
  relays?: Relay[];
  isLoading?: boolean;
  statsLoading?: {
    followers?: boolean;
    following?: boolean;
    relays?: boolean;
  };
  onRefresh?: () => void;
  currentUserPubkey?: string | null;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  profile, 
  npub, 
  hexPubkey,
  followers = [],
  following = [], 
  relays = [],
  isLoading = false,
  statsLoading = {},
  onRefresh,
  currentUserPubkey
}) => {
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showRelays, setShowRelays] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  
  const name = profile?.name || npub;
  const displayName = profile?.display_name || name;
  const picture = profile?.picture || '';
  const banner = profile?.banner || '';
  const about = profile?.about || '';
  const nip05 = profile?.nip05 || '';
  const website = profile?.website || '';
  const created_at = profile?._event?.created_at;
  
  // Get the first character of the display name for the avatar fallback
  const avatarFallback = displayName ? displayName.charAt(0).toUpperCase() : 'N';
  
  // Format creation date if available
  const formattedDate = created_at 
    ? format(new Date(created_at * 1000), 'MMMM yyyy')
    : '';
  
  // Use the utility function to check if this is the current user
  const currentUserOwnsProfile = isCurrentUser(hexPubkey, nostrService.publicKey);
  
  // Short version of npub for display (handle potential errors)
  const shortNpub = (() => {
    try {
      return `${npub.substring(0, 9)}...${npub.substring(npub.length - 5)}`;
    } catch (e) {
      console.error("Error formatting short npub:", e);
      return npub.substring(0, 15) + '...';
    }
  })();
  
  // Format stats counts
  const followersCount = followers.length;
  const followingCount = following.length;
  const relaysCount = relays.length;
  
  // Helper function to render user list items for dialogs
  const renderUserListItem = (pubkey: string) => {
    const npubStr = nostrService.getNpubFromHex(pubkey);
    const shortNpubStr = `${npubStr.substring(0, 8)}...${npubStr.substring(npubStr.length - 5)}`;
    
    return (
      <div key={pubkey} className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{pubkey.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div>{shortNpubStr}</div>
        </div>
        
        {currentUserPubkey && currentUserPubkey !== pubkey && (
          <FollowButton pubkey={pubkey} variant="outline" size="sm" />
        )}
      </div>
    );
  };
  
  // Handle profile update
  const handleProfileUpdate = () => {
    // Refresh the profile data
    if (onRefresh) {
      onRefresh();
    }
  };
  
  return (
    <div className="mb-6">
      {/* Banner */}
      <div 
        className="h-40 bg-muted w-full rounded-t-lg bg-cover bg-center"
        style={banner ? { backgroundImage: `url(${banner})` } : {}}
      />
      
      {/* Profile info */}
      <div className="px-4 pb-4 border-b">
        <div className="flex justify-between items-start relative">
          {/* Avatar */}
          <Avatar className="h-24 w-24 border-4 border-background -mt-12 bg-background">
            <AvatarImage src={picture} alt={displayName} />
            <AvatarFallback className="text-xl">{avatarFallback}</AvatarFallback>
          </Avatar>
          
          {/* Action buttons */}
          <div className="mt-4 flex space-x-2">
            {currentUserOwnsProfile ? (
              <Button 
                variant="outline" 
                onClick={() => setShowEditProfile(true)}
              >
                Edit Profile
              </Button>
            ) : (
              <FollowButton pubkey={hexPubkey} variant="default" />
            )}
          </div>
        </div>
        
        {/* Profile name and details */}
        <div className="mt-3">
          <h1 className="text-xl font-bold">{displayName}</h1>
          <p className="text-muted-foreground">@{shortNpub}</p>
          
          {/* Bio */}
          {about && (
            <p className="mt-3 whitespace-pre-wrap">{about}</p>
          )}
          
          {/* Profile metadata */}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {website && (
              <a 
                href={website.startsWith('http') ? website : `https://${website}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center hover:text-primary"
              >
                <LinkIcon className="h-3.5 w-3.5 mr-1" />
                {website.replace(/^https?:\/\//, '')}
              </a>
            )}
            
            {nip05 && (
              <div className="flex items-center">
                <MapPin className="h-3.5 w-3.5 mr-1" />
                {nip05}
              </div>
            )}
            
            {formattedDate && (
              <div className="flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                Joined {formattedDate}
              </div>
            )}
          </div>
          
          {/* Stats counters */}
          <div className="mt-4 flex items-center space-x-5 text-sm">
            {/* Following count */}
            <button 
              onClick={() => followingCount > 0 && setShowFollowing(true)} 
              className="flex items-center hover:text-primary transition-colors"
              disabled={statsLoading.following || followingCount === 0}
            >
              {statsLoading.following ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  <span className="font-medium text-muted-foreground">Loading</span>
                </>
              ) : (
                <>
                  <User className="h-4 w-4 mr-1.5" />
                  <span className="font-medium">{followingCount}</span>
                  <span className="ml-1 text-muted-foreground">Following</span>
                </>
              )}
            </button>
            
            {/* Followers count */}
            <button 
              onClick={() => followersCount > 0 && setShowFollowers(true)} 
              className="flex items-center hover:text-primary transition-colors"
              disabled={statsLoading.followers || followersCount === 0}
            >
              {statsLoading.followers ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  <span className="font-medium text-muted-foreground">Loading</span>
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-1.5" />
                  <span className="font-medium">{followersCount}</span>
                  <span className="ml-1 text-muted-foreground">Followers</span>
                </>
              )}
            </button>
            
            {/* Relays count */}
            <button 
              onClick={() => relaysCount > 0 && setShowRelays(true)} 
              className="flex items-center hover:text-primary transition-colors"
              disabled={statsLoading.relays || relaysCount === 0}
            >
              {statsLoading.relays ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  <span className="font-medium text-muted-foreground">Loading</span>
                </>
              ) : (
                <>
                  <Network className="h-4 w-4 mr-1.5" />
                  <span className="font-medium">{relaysCount}</span>
                  <span className="ml-1 text-muted-foreground">Relays</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Following Dialog */}
      <Dialog open={showFollowing} onOpenChange={setShowFollowing}>
        <DialogContent className="sm:max-w-[420px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Following</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {followingCount === 0 ? (
              <div className="text-center text-muted-foreground">Not following anyone yet</div>
            ) : (
              <div className="space-y-1">
                {following.map(pubkey => renderUserListItem(pubkey))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Followers Dialog */}
      <Dialog open={showFollowers} onOpenChange={setShowFollowers}>
        <DialogContent className="sm:max-w-[420px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Followers</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {followersCount === 0 ? (
              <div className="text-center text-muted-foreground">No followers yet</div>
            ) : (
              <div className="space-y-1">
                {followers.map(pubkey => renderUserListItem(pubkey))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Relays Dialog - Reuse the existing ProfileRelaysDialog component */}
      <ProfileRelaysDialog
        open={showRelays}
        onOpenChange={setShowRelays}
        relays={relays}
        onRelaysChange={() => onRefresh?.()}
        isCurrentUser={currentUserOwnsProfile}
        userNpub={npub}
      />
      
      {/* Edit Profile Dialog */}
      <EditProfileDialog
        open={showEditProfile}
        onOpenChange={setShowEditProfile}
        profile={profile}
        onProfileUpdate={handleProfileUpdate}
      />
    </div>
  );
};

export default ProfileHeader;
