
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare, Heart, Repeat, Share, MoreHorizontal } from "lucide-react";
import { formatDistance } from 'date-fns';
import { useAction } from './hooks/use-action';
import { NoteCardProps } from '@/lib/nostr/types';
import { nostrService } from '@/lib/nostr';

export function NoteCard({ event, showActionButtons = false }: NoteCardProps) {
  const { id, pubkey, content, created_at } = event;
  const [profileData, setProfileData] = React.useState<any>({});
  const { handleLike, isLiking, handleRepost, isReposting } = useAction({ 
    eventId: id, 
    authorPubkey: pubkey,
    event
  });

  // Fetch profile data
  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await nostrService.getUserProfile(pubkey);
        if (profile) {
          setProfileData(profile);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, [pubkey]);

  const timeAgo = formatDistance(new Date(created_at * 1000), new Date(), { addSuffix: true });
  const displayName = profileData.display_name || profileData.name || nostrService.formatPubkey(pubkey, 'npub').slice(0, 10) + '...';
  const avatarUrl = profileData.picture || '';

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback>{displayName.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">
                  {timeAgo} · {nostrService.formatPubkey(pubkey, 'npub').slice(0, 10)}...
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-2">
        <p className="whitespace-pre-wrap">{content}</p>
      </CardContent>
      {showActionButtons && (
        <CardFooter className="px-4 pt-0 pb-3 flex justify-between">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <MessageSquare className="h-4 w-4 mr-1" /> 0
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground" 
            onClick={handleRepost}
            disabled={isReposting}
          >
            <Repeat className={`h-4 w-4 mr-1 ${isReposting ? 'animate-spin' : ''}`} /> 0
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground" 
            onClick={handleLike}
            disabled={isLiking}
          >
            <Heart className={`h-4 w-4 mr-1 ${isLiking ? 'animate-pulse' : ''}`} /> 0
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Share className="h-4 w-4 mr-1" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
