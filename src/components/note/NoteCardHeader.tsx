
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { nostrService } from '@/lib/nostr';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

interface NoteCardHeaderProps {
  pubkey: string;
  createdAt: number;
  profileData?: Record<string, any>;
}

const NoteCardHeader = ({ pubkey, createdAt, profileData }: NoteCardHeaderProps) => {
  // Ensure we have a valid pubkey
  const hexPubkey = pubkey || '';
  
  // Get npub with error handling
  let npub = '';
  let shortNpub = '';
  
  try {
    if (hexPubkey) {
      // Validate hex format (64 hex chars)
      if (hexPubkey.length === 64 && /^[0-9a-f]+$/i.test(hexPubkey)) {
        npub = nostrService.getNpubFromHex(hexPubkey);
      } else if (hexPubkey.startsWith('npub1')) {
        npub = hexPubkey;
      } else {
        // Handle invalid format with a placeholder
        npub = 'npub1unknown';
      }
      
      // Handle short display of npub (first 9 and last 5 chars)
      shortNpub = `${npub.substring(0, 9)}...${npub.substring(npub.length - 5)}`;
    } else {
      npub = 'npub1unknown';
      shortNpub = 'unknown';
    }
  } catch (error) {
    console.error('Error in NoteCardHeader with pubkey:', hexPubkey, error);
    npub = 'npub1unknown';
    shortNpub = 'unknown';
  }
  
  // Get profile info if available
  const name = profileData?.name || shortNpub;
  const displayName = profileData?.display_name || name;
  const picture = profileData?.picture || '';
  
  // Get the first character of the display name for the avatar fallback
  const avatarFallback = displayName ? displayName.charAt(0).toUpperCase() : 'N';
  
  // Format the created at timestamp
  let timeAgo = 'some time ago';
  try {
    if (createdAt && createdAt > 0) {
      timeAgo = formatDistanceToNow(
        new Date(createdAt * 1000),
        { addSuffix: true }
      );
    }
  } catch (error) {
    console.error('Error formatting time:', error);
  }

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
