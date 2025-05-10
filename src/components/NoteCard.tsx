
import { useState } from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { NostrEvent } from '@/lib/nostr';
import NoteCardHeader from './note/NoteCardHeader';
import NoteCardContent from './note/NoteCardContent';
import NoteCardActions from './note/NoteCardActions';
import NoteCardComments from './note/NoteCardComments';

interface NoteCardProps {
  event: NostrEvent;
  profileData?: Record<string, any>;
}

const NoteCard = ({ event, profileData }: NoteCardProps) => {
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
