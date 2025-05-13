
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { nostrService } from '@/lib/nostr';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { isValidHexPubkey } from '@/lib/nostr/utils/keys';

interface NoteCardHeaderProps {
  pubkey: string;
  createdAt: number;
  profileData?: Record<string, any>;
}

const NoteCardHeader = ({ pubkey, createdAt, profileData }: NoteCardHeaderProps) => {
  const [imageError, setImageError] = useState(false);
  
  // Safely convert the hex pubkey to npub format
  const safeGetNpub = (hexPubkey: string): string => {
    try {
      // Validate hex format first
      if (isValidHexPubkey(hexPubkey)) {
        return nostrService.getNpubFromHex(hexPubkey);
      }
      
      // If already npub format, return as-is
      if (hexPubkey.startsWith('npub1')) {
        return hexPubkey;
      }
      
      // Fallback for invalid formats
      console.warn('Invalid pubkey format:', hexPubkey);
      return `npub1invalid_${hexPubkey.substring(0, 8)}`;
    } catch (error) {
      console.error('Error converting pubkey format:', error);
      return `npub1error_${hexPubkey.substring(0, 6)}`;
    }
  };
  
  // Apply sanitization to pubkey
  const hexPubkey = pubkey || '';
  const npub = safeGetNpub(hexPubkey);
  
  // Handle short display of npub (first 5 and last 5 chars)
  const shortNpub = npub.length > 14 
    ? `${npub.substring(0, 9)}...${npub.substring(npub.length - 5)}` 
    : npub;
  
  // Get profile info if available
  const name = profileData?.name || shortNpub;
  const displayName = profileData?.display_name || name;
  const picture = profileData?.picture || '';
  
  // Get the first character of the display name for the avatar fallback
  const avatarFallback = displayName ? displayName.charAt(0).toUpperCase() : 'N';
  
  // Format time for readability
  const formatTimeAgo = (timestamp: number): string => {
    try {
      if (!timestamp) return 'Unknown time';
      return formatDistanceToNow(
        new Date(timestamp * 1000),
        { addSuffix: true }
      );
    } catch (error) {
      console.warn('Error formatting time:', error);
      return 'Unknown time';
    }
  };
  
  const timeAgo = formatTimeAgo(createdAt);

  // Handle profile link creation safely
  const getProfileLink = (): string => {
    if (!npub) return '#';
    return `/profile/${npub}`;
  };
  
  const profileLink = getProfileLink();

  return (
    <div className="flex justify-between">
      <div className="flex">
        <Link to={profileLink} className="mr-3 shrink-0">
          <Avatar className="h-11 w-11 border border-muted">
            {picture && !imageError ? (
              <AvatarImage 
                src={picture} 
                alt={name} 
                onError={() => setImageError(true)}
              />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary">{avatarFallback}</AvatarFallback>
          </Avatar>
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-x-1 flex-wrap">
            <Link to={profileLink} className="font-bold truncate hover:underline">
              {displayName}
            </Link>
            
            <span className="text-muted-foreground text-sm truncate">@{shortNpub}</span>
            <span className="text-muted-foreground text-sm mx-0.5">·</span>
            <span className="text-muted-foreground text-sm hover:underline cursor-pointer">{timeAgo}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NoteCardHeader;
