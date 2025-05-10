
import { useState } from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { NostrEvent } from '@/lib/nostr';
import NoteCardHeader from './note/NoteCardHeader';
import NoteCardContent from './note/NoteCardContent';
import NoteCardActions from './note/NoteCardActions';
import NoteCardComments from './note/NoteCardComments';
import { Repeat } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NoteCardProps {
  event: NostrEvent;
  profileData?: Record<string, any>;
  repostData?: {
    reposterPubkey: string;
    reposterProfile?: Record<string, any>;
  }
}

const NoteCard = ({ event, profileData, repostData }: NoteCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [replyCount, setReplyCount] = useState(0);
  
  const handleCommentClick = () => {
    setShowComments(!showComments);
  };
  
  const handleReplyAdded = () => {
    setReplyCount(prev => prev + 1);
  };

  return (
    <Card className="mb-4 hover:bg-accent/20 transition-colors">
      {repostData && (
        <div className="px-4 pt-2 text-xs text-muted-foreground flex items-center gap-1">
          <Repeat className="h-3 w-3" />
          <span>Reposted by </span>
          <Link 
            to={`/profile/${repostData.reposterPubkey}`} 
            className="font-medium hover:underline"
          >
            {repostData.reposterProfile?.name || repostData.reposterProfile?.display_name || "Unknown"}
          </Link>
        </div>
      )}
      <CardContent className="pt-4">
        <NoteCardHeader 
          pubkey={event.pubkey || ''} 
          createdAt={event.created_at} 
          profileData={profileData} 
        />
        <NoteCardContent content={event.content} />
      </CardContent>
      
      <CardFooter>
        <NoteCardActions 
          eventId={event.id || ''} 
          pubkey={event.pubkey || ''} 
          onCommentClick={handleCommentClick} 
          replyCount={replyCount} 
        />
      </CardFooter>
      
      {showComments && (
        <NoteCardComments
          eventId={event.id || ''}
          pubkey={event.pubkey || ''}
          onReplyAdded={handleReplyAdded}
        />
      )}
    </Card>
  );
};

export default NoteCard;
