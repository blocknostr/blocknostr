
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Repeat, Share } from 'lucide-react';
import { useState } from 'react';
import { NostrEvent, nostrService } from '@/lib/nostr';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface NoteCardProps {
  event: NostrEvent;
  profileData?: Record<string, any>;
}

const NoteCard = ({ event, profileData }: NoteCardProps) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [replyCount, setReplyCount] = useState(0);
  
  const hexPubkey = event.pubkey || '';
  const npub = nostrService.getNpubFromHex(hexPubkey);
  
  // Handle short display of npub (first 5 and last 5 chars)
  const shortNpub = `${npub.substring(0, 9)}...${npub.substring(npub.length - 5)}`;
  
  // Get profile info if available
  const name = profileData?.name || shortNpub;
  const displayName = profileData?.display_name || name;
  const picture = profileData?.picture || '';
  
  const handleLike = async () => {
    if (!liked) {
      // Create a reaction event (kind 7)
      await nostrService.publishEvent({
        kind: 7,
        content: '+',  // '+' for like
        tags: [['e', event.id || ''], ['p', event.pubkey || '']]
      });
      
      setLiked(true);
      setLikeCount(prev => prev + 1);
    }
  };
  
  const timeAgo = formatDistanceToNow(
    new Date(event.created_at * 1000),
    { addSuffix: true }
  );
  
  // Get the first character of the display name for the avatar fallback
  const avatarFallback = displayName ? displayName.charAt(0).toUpperCase() : 'N';

  return (
    <Card className="mb-4 hover:bg-accent/20 transition-colors">
      <CardContent className="pt-4">
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
            <p className="mt-1 whitespace-pre-wrap break-words">{event.content}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-0">
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <MessageCircle className="h-4 w-4 mr-1" />
          {replyCount > 0 ? replyCount : ''}
        </Button>
        
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Repeat className="h-4 w-4 mr-1" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className={liked ? "text-red-500" : "text-muted-foreground"}
          onClick={handleLike}
        >
          <Heart className="h-4 w-4 mr-1" fill={liked ? "currentColor" : "none"} />
          {likeCount > 0 ? likeCount : ''}
        </Button>
        
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Share className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NoteCard;
