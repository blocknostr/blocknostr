
import { useState } from 'react';
import { NostrEvent } from '@/lib/nostr';
import NoteAuthor from './note/NoteAuthor';
import NoteContent from './note/NoteContent';
import NoteActions from './note/NoteActions';
import NoteCommentSection from './note/NoteCommentSection';

interface NoteCardProps {
  event: NostrEvent;
  profileData?: Record<string, any>;
}

const NoteCard = ({ event, profileData }: NoteCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [replyCount, setReplyCount] = useState(0);
  
  const handleToggleComments = () => {
    setShowComments(!showComments);
  };
  
  const handleAddComment = (comment: any) => {
    setComments(prev => [...prev, comment]);
    setReplyCount(prev => prev + 1);
  };
  
  return (
    <div className="border-b hover:bg-accent/5 transition-colors px-4 py-3">
      <div className="flex">
        <div className="flex-1 min-w-0">
          <NoteAuthor 
            pubkey={event.pubkey || ''} 
            profileData={profileData} 
            createdAt={event.created_at} 
          />
          
          <NoteContent content={event.content} />
          
          <NoteActions 
            event={event} 
            onToggleComments={handleToggleComments} 
            replyCount={replyCount} 
          />
      
          {showComments && (
            <NoteCommentSection 
              event={event} 
              comments={comments} 
              onAddComment={handleAddComment} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
