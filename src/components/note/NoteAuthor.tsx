
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { nostrService } from "@/lib/nostr";
import { formatDistanceToNow } from 'date-fns';

interface NoteAuthorProps {
  pubkey: string;
  profileData?: Record<string, any>;
  createdAt: number;
}

const NoteAuthor = ({ pubkey, profileData, createdAt }: NoteAuthorProps) => {
  const npub = nostrService.getNpubFromHex(pubkey);
  
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
    <div className="flex items-center gap-2 flex-wrap">
      <Link to={`/profile/${npub}`} className="shrink-0 mr-3">
        <Avatar className="h-10 w-10 cursor-pointer hover:opacity-90 transition-opacity">
          <AvatarImage src={picture} alt={name} />
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>
      </Link>
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link to={`/profile/${npub}`} className="font-bold hover:underline truncate">
            {displayName}
          </Link>
          <Link to={`/profile/${npub}`} className="text-muted-foreground text-sm truncate hover:underline">
            @{shortNpub}
          </Link>
          <span className="text-muted-foreground text-sm">·</span>
          <span className="text-muted-foreground text-sm hover:underline cursor-pointer">{timeAgo}</span>
        </div>
      </div>
    </div>
  );
};

export default NoteAuthor;
