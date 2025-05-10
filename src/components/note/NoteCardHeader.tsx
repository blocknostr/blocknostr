
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { nostrService } from '@/lib/nostr';
import { formatDistanceToNow } from 'date-fns';

interface NoteCardHeaderProps {
  pubkey: string;
  createdAt: number;
  profileData?: Record<string, any>;
}

const NoteCardHeader = ({ pubkey, createdAt, profileData }: NoteCardHeaderProps) => {
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
  
  const timeAgo = formatDistanceToNow(
    new Date(createdAt * 1000),
    { addSuffix: true }
  );

  return (
    <div className="flex">
      <Avatar className="h-10 w-10 mr-3 shrink-0">
        <AvatarImage src={picture} alt={name} />
        <AvatarFallback>{avatarFallback}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold truncate">{displayName}</span>
          <span className="text-muted-foreground text-sm truncate">@{shortNpub}</span>
          <span className="text-muted-foreground text-sm">·</span>
          <span className="text-muted-foreground text-sm">{timeAgo}</span>
        </div>
      </div>
    </div>
  );
};

export default NoteCardHeader;
