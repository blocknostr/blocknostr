
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { nostrService } from '@/lib/nostr';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { BadgeCheck } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NoteCardHeaderProps {
  pubkey: string;
  createdAt: number;
  profileData?: Record<string, any>;
}

const NoteCardHeader = ({ pubkey, createdAt, profileData }: NoteCardHeaderProps) => {
  const hexPubkey = pubkey || '';
  const npub = nostrService.getNpubFromHex(hexPubkey);
  const currentUserPubkey = nostrService.publicKey;
  const [xVerified, setXVerified] = useState(false);
  
  // Handle short display of npub (first 5 and last 5 chars)
  const shortNpub = `${npub.substring(0, 9)}...${npub.substring(npub.length - 5)}`;
  
  // Get profile info if available
  const name = profileData?.name || shortNpub;
  const displayName = profileData?.display_name || name;
  const picture = profileData?.picture || '';
  
  // Get the first character of the display name for the avatar fallback
  const avatarFallback = displayName ? displayName.charAt(0).toUpperCase() : 'N';
  
  const timeAgo = formatDistanceToNow(
    new Date(createdAt * 1000),
    { addSuffix: true }
  );

  // Check for X verification status from profile
  useEffect(() => {
    // Check if profile has X verification (either via our legacy method or NIP-39)
    if (profileData) {
      // First, check our custom twitter_verified field
      if (profileData.twitter_verified) {
        setXVerified(true);
        return;
      }
      
      // Then check for NIP-39 i tags in the raw event
      if (profileData.tags && Array.isArray(profileData.tags)) {
        const hasTwitterTag = profileData.tags.some(tag => 
          tag.length >= 3 && tag[0] === 'i' && tag[1].startsWith('twitter:')
        );
        
        if (hasTwitterTag) {
          setXVerified(true);
          return;
        }
      }
      
      setXVerified(false);
    }
  }, [profileData]);

  return (
    <div className="flex justify-between">
      <div className="flex">
        <Link 
          to={`/profile/${npub}`} 
          className="mr-3 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Avatar className="h-11 w-11 border border-muted">
            <AvatarImage src={picture} alt={name} />
            <AvatarFallback className="bg-primary/10 text-primary">{avatarFallback}</AvatarFallback>
          </Avatar>
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-x-1 flex-wrap">
            <Link 
              to={`/profile/${npub}`}
              className="font-bold hover:underline truncate flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {displayName}
              {xVerified && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <BadgeCheck className="h-3.5 w-3.5 text-blue-500 inline-block ml-0.5" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Verified X account (NIP-39)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </Link>
            
            <span className="text-muted-foreground text-sm truncate">@{shortNpub}</span>
            <span className="text-muted-foreground text-sm mx-0.5">·</span>
            <span className="text-muted-foreground text-sm hover:underline cursor-pointer">{timeAgo}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteCardHeader;
