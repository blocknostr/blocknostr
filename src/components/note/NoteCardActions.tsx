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
  return <div className="px-[141px]make it evenly spaced">
      <CommentButton onClick={onCommentClick} replyCount={replyCount} />
      
      <RetweetButton onClick={handleRetweet} retweeted={retweeted} retweetCount={retweetCount} />
      
      <LikeButton onClick={handleLike} liked={liked} likeCount={likeCount} />
      
      <ViewButton reachCount={reachCount} />
      
      <TipButton onClick={handleSendTip} tipCount={tipCount} />
      
      {isAuthor && onDelete && <DeleteButton onClick={onDelete} />}
    </div>;
};
export default NoteCardActions;