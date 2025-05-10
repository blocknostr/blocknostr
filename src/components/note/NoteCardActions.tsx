
import { useNoteActions } from './actions/useNoteActions';
import CommentButton from './actions/CommentButton';
import RetweetButton from './actions/RetweetButton';
import LikeButton from './actions/LikeButton';
import ViewButton from './actions/ViewButton';
import TipButton from './actions/TipButton';
import DeleteButton from './actions/DeleteButton';

interface NoteCardActionsProps {
  eventId: string;
  pubkey: string;
  onCommentClick: () => void;
  replyCount: number;
  onDelete?: () => void;
  isAuthor?: boolean;
  reachCount?: number;
  onRetweetStatusChange?: (isRetweeted: boolean) => void;
}

const NoteCardActions = ({
  eventId,
  pubkey,
  onCommentClick,
  replyCount,
  onDelete,
  isAuthor,
  reachCount = 0,
  onRetweetStatusChange
}: NoteCardActionsProps) => {
  const {
    liked,
    likeCount,
    retweeted,
    retweetCount,
    tipCount,
    handleLike,
    handleRetweet,
    handleSendTip
  } = useNoteActions({
    eventId,
    pubkey
  });
  
  const handleRetweetAction = () => {
    handleRetweet();
  };
  
  return (
    <div className="flex items-center justify-between w-full pt-2">
      <div className="flex items-center space-x-1">
        <CommentButton onClick={onCommentClick} replyCount={replyCount} />
        <RetweetButton 
          onClick={handleRetweetAction} 
          retweeted={retweeted} 
          retweetCount={retweetCount}
          onRetweetStatusChange={onRetweetStatusChange} 
        />
        <LikeButton onClick={handleLike} liked={liked} likeCount={likeCount} />
      </div>
      
      <div className="flex items-center space-x-1">
        <ViewButton reachCount={reachCount} />
        <TipButton onClick={handleSendTip} tipCount={tipCount} />
        {isAuthor && onDelete && <DeleteButton onClick={onDelete} />}
      </div>
    </div>
  );
};

export default NoteCardActions;
