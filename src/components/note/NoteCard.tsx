
import React, { useState } from 'react';
import { NostrEvent, NostrProfileMetadata } from '@/lib/nostr';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { useAction } from './hooks/use-action';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, RepeatIcon } from 'lucide-react';

export interface NoteCardProps {
  event: NostrEvent;
  showActionButtons?: boolean;
}

export function NoteCard({ event, showActionButtons = true }: NoteCardProps) {
  const [profile, setProfile] = useState<NostrProfileMetadata | null>(null);
  const { handleLike, isLiking, handleRepost, isReposting } = useAction({
    eventId: event.id,
    authorPubkey: event.pubkey,
    event
  });

  // Format date
  const formattedDate = formatDistanceToNow(new Date(event.created_at * 1000), {
    addSuffix: true
  });

  // Format content (handle markdown, links, etc.)
  const content = event.content;

  // Get initials for avatar fallback
  const getInitials = () => {
    if (profile?.name) {
      return profile.name.substring(0, 2).toUpperCase();
    }
    if (profile?.display_name) {
      return profile.display_name.substring(0, 2).toUpperCase();
    }
    return event.pubkey.substring(0, 2).toUpperCase();
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.picture} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">
              {profile?.display_name || profile?.name || `${event.pubkey.substring(0, 8)}...`}
            </p>
            <p className="text-xs text-muted-foreground">
              {formattedDate}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-2">
        <div className="whitespace-pre-wrap">{content}</div>
      </CardContent>
      
      {showActionButtons && (
        <CardFooter className="px-4 py-3 border-t flex justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground" 
            onClick={handleLike} 
            disabled={isLiking}
          >
            <Heart className="h-4 w-4 mr-1" />
            <span>Like</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground"
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            <span>Reply</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground"
            onClick={handleRepost}
            disabled={isReposting}
          >
            <RepeatIcon className="h-4 w-4 mr-1" />
            <span>Repost</span>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export default NoteCard;
