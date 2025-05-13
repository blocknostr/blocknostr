
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { nostrService } from '@/lib/nostr';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

interface NoteCardHeaderProps {
  pubkey: string;
  createdAt?: number;
  timestamp?: number; // Add timestamp as an alternative to createdAt
  profileData?: Record<string, any>;
}

const NoteCardHeader = ({ pubkey, createdAt, timestamp, profileData }: NoteCardHeaderProps) => {
  const hexPubkey = pubkey || '';
  const npub = nostrService.getNpubFromHex(hexPubkey);
  
  // Handle short display of npub (first 5 and last 5 chars)
  const shortNpub = `${npub.substring(0, 9)}...${npub.substring(npub.length - 5)}`;
  
  // Get profile info if available
  const name = profileData?.name || shortNpub;
  const displayName = profileData?.display_name || name;
  const picture = profileData?.picture || '';
  
  // Get the first character of the display name for the avatar fallback
  const avatarFallback = displayName ? displayName.charAt(0).toUpperCase() : 'N';
  
  // Use timestamp as fallback if createdAt is not provided
  const eventTime = createdAt || timestamp || 0;
  
  // Add a check to prevent issues with invalid dates
  const timeAgo = eventTime > 0 
    ? formatDistanceToNow(new Date(eventTime * 1000), { addSuffix: true })
    : 'unknown time';

  return (
    <div className="flex justify-between">
      <div className="flex">
        <Link to={`/profile/${npub}`} className="mr-3 shrink-0">
          <Avatar className="h-11 w-11 border border-muted">
            <AvatarImage src={picture} alt={name} />
            <AvatarFallback className="bg-primary/10 text-primary">{avatarFallback}</AvatarFallback>
          </Avatar>
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-x-1 flex-wrap">
            <Link to={`/profile/${npub}`} className="font-bold truncate hover:underline">
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
