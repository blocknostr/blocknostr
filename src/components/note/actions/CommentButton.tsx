
import { MessageCircle } from 'lucide-react';
import ActionButton from './ActionButton';

interface CommentButtonProps {
  onClick: (e: React.MouseEvent) => void;
  replyCount: number;
}

const CommentButton = ({ onClick, replyCount }: CommentButtonProps) => {
  return (
    <ActionButton
      onClick={(e) => {
        if (e) e.preventDefault();
        onClick(e);
      }}
      icon={<MessageCircle className="h-4 w-4" />}
      label="Comment"
      count={replyCount}
      hoverClass="hover:text-[#1EAEDB] group-hover:text-[#1EAEDB]"
    />
  );
};

export default CommentButton;
