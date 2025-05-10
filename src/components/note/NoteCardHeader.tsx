
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { nostrService } from '@/lib/nostr';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import FollowButton from '../FollowButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { useState } from 'react';

interface NoteCardHeaderProps {
  pubkey: string;
  createdAt: number;
  profileData?: Record<string, any>;
}

const NoteCardHeader = ({ pubkey, createdAt, profileData }: NoteCardHeaderProps) => {
  const hexPubkey = pubkey || '';
  const npub = nostrService.getNpubFromHex(hexPubkey);
  const currentUserPubkey = nostrService.publicKey;
  const [isUserBlocked, setIsUserBlocked] = useState(false);
  const [isUserMuted, setIsUserMuted] = useState(false);
  
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

  const isCurrentUser = currentUserPubkey === hexPubkey;

  const handleNotInterested = () => {
    toast.success("We'll show fewer posts like this");
  };

  const handleMuteAuthor = () => {
    // Here you would implement the actual muting logic using nostrService
    setIsUserMuted(true);
    toast.success(`Muted ${displayName}`);
  };

  const handleBlockAuthor = () => {
    // Here you would implement the actual blocking logic using nostrService
    setIsUserBlocked(true);
    toast.success(`Blocked ${displayName}`);
  };

  return (
    <div className="flex justify-between">
      <div className="flex">
        <Link 
          to={`/profile/${hexPubkey}`} 
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
              to={`/profile/${hexPubkey}`}
              className="font-bold hover:underline truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {displayName}
            </Link>
            
            <span className="text-muted-foreground text-sm truncate">@{shortNpub}</span>
            <span className="text-muted-foreground text-sm mx-0.5">·</span>
            <span className="text-muted-foreground text-sm hover:underline cursor-pointer">{timeAgo}</span>
          </div>
        </div>
      </div>
      
      {/* Options dropdown menu */}
      <div onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-full hover:bg-accent/80 focus:outline-none">
              <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleNotInterested}>
              Not interested in this post
            </DropdownMenuItem>
            
            {!isCurrentUser && !isUserBlocked && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <FollowButton pubkey={hexPubkey} className="w-full justify-center" />
                </div>
                <DropdownMenuSeparator />
                {!isUserMuted ? (
                  <DropdownMenuItem onClick={handleMuteAuthor}>
                    Mute @{name}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => setIsUserMuted(false)}>
                    Unmute @{name}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleBlockAuthor} className="text-destructive focus:text-destructive">
                  Block @{name}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default NoteCardHeader;
