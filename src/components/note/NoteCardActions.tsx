
import { nostrService } from "@/lib/nostr";
import { ActionsContext } from './actions/ActionsContext';
import CommentAction from './actions/CommentAction';
import RepostAction from './actions/RepostAction';
import LikeAction from './actions/LikeAction';
import BookmarkAction from './actions/BookmarkAction';
import ShareAction from './actions/ShareAction';
import DeleteAction from './actions/DeleteAction';

interface NoteCardActionsProps {
  eventId: string;
  pubkey: string;
  onCommentClick?: () => void;
  replyCount?: number;
  isAuthor?: boolean;
  onDelete?: () => void;
  reposterPubkey?: string | null;
  showRepostHeader?: boolean;
}

const NoteCardActions = ({ 
  eventId, 
  pubkey,
  onCommentClick,
  replyCount = 0,
  isAuthor = false,
  onDelete,
  reposterPubkey, 
  showRepostHeader
}: NoteCardActionsProps) => {
  const isLoggedIn = !!nostrService.publicKey;
  
  const handleCommentClick = (e: React.MouseEvent) => {
    if (onCommentClick) {
      onCommentClick();
    }
  };
  
  const contextValue = {
    eventId,
    pubkey,
    isLoggedIn,
    isAuthor,
    reposterPubkey,
    showRepostHeader
  };
  
  return (
    <ActionsContext.Provider value={contextValue}>
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-5">
          <CommentAction onCommentClick={handleCommentClick} replyCount={replyCount} />
          <RepostAction />
          <LikeAction />
          <BookmarkAction />
          <DeleteAction onDelete={onDelete} />
        </div>
        
        <ShareAction />
      </div>
    </ActionsContext.Provider>
  );
};

export default NoteCardActions;
