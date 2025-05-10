
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
  onCommentClick: (e: React.MouseEvent) => void;
  replyCount: number;
  onDelete?: (e: React.MouseEvent) => void;
  isAuthor?: boolean;
  reachCount?: number;
}

const NoteCardActions = ({
  eventId,
  pubkey,
  onCommentClick,
  replyCount,
  onDelete,
  isAuthor,
  reachCount = 0
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
  
  return (
    <div className="flex items-center justify-between w-full pt-2 px-[10px]">
      <div className="flex items-center">
        <CommentButton onClick={(e) => {
          e.stopPropagation(); // Prevent navigation when clicking comment
          onCommentClick(e);
        }} replyCount={replyCount} />
        <RetweetButton onClick={handleRetweet} retweeted={retweeted} retweetCount={retweetCount} />
        <LikeButton onClick={handleLike} liked={liked} likeCount={likeCount} />
      </div>
      
      <div className="flex items-center">
        <ViewButton reachCount={reachCount} />
        <TipButton onClick={handleSendTip} tipCount={tipCount} />
        {isAuthor && onDelete && <DeleteButton onClick={(e) => {
          e.stopPropagation(); // Prevent navigation when clicking delete
          onDelete(e);
        }} />}
      </div>
    </div>
  );
};

export default NoteCardActions;
