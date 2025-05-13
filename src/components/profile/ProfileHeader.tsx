
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Link as LinkIcon, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { isCurrentUser } from '@/lib/utils/pubkeyUtils';
import { nostrService } from '@/lib/nostr';
import FollowButton from '@/components/FollowButton';

interface ProfileHeaderProps {
  profile: any;
  npub: string;
  hexPubkey: string;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, npub, hexPubkey }) => {
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
              <Button variant="outline">Edit Profile</Button>
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
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
