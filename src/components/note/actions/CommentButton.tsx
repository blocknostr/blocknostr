
import { MessageCircle } from 'lucide-react';
import ActionButton from './ActionButton';

interface CommentButtonProps {
  onClick: () => void;
  replyCount: number;
}

const CommentButton = ({ onClick, replyCount }: CommentButtonProps) => {
  return (
    <ActionButton
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      icon={<MessageCircle className="h-4 w-4" />}
      label="Comment"
      count={replyCount}
      hoverClass="hover:text-blue-500 group-hover:text-blue-500"
    />
  );
};

export default CommentButton;
