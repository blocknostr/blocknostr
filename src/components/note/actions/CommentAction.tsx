
import { MessageSquare } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useActionsContext } from './ActionsContext';

interface CommentActionProps {
  onCommentClick?: (e: React.MouseEvent) => void;
  replyCount?: number;
}

const CommentAction = ({ onCommentClick, replyCount = 0 }: CommentActionProps) => {
  const handleCommentButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCommentClick) {
      onCommentClick(e);
    }
  };
  
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="rounded-full hover:text-blue-500 hover:bg-blue-500/10"
      onClick={handleCommentButtonClick}
      title="Reply"
    >
      <MessageSquare className="h-[18px] w-[18px]" />
      {replyCount > 0 && (
        <span className="ml-1 text-xs">{replyCount}</span>
      )}
    </Button>
  );
};

export default CommentAction;
