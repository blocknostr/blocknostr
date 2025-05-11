
import { MessageSquare } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface CommentButtonProps {
  replyCount: number;
  onClick: (e: React.MouseEvent) => void;
}

const CommentButton = ({ replyCount, onClick }: CommentButtonProps) => {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="rounded-full h-8 w-8 hover:text-blue-500 hover:bg-blue-500/10"
      onClick={onClick}
      title="Reply"
    >
      <MessageSquare className="h-[16px] w-[16px]" />
      {replyCount > 0 && (
        <span className="ml-1 text-xs">{replyCount}</span>
      )}
    </Button>
  );
};

export default CommentButton;
