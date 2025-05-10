
import { Heart } from 'lucide-react';
import ActionButton from './ActionButton';

interface LikeButtonProps {
  onClick: () => void;
  liked: boolean;
  likeCount: number;
}

const LikeButton = ({ onClick, liked, likeCount }: LikeButtonProps) => {
  return (
    <ActionButton
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      icon={<Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />}
      label="Like"
      count={likeCount}
      active={liked}
      activeClass="text-red-500"
      hoverClass="hover:bg-red-50 hover:text-red-600"
    />
  );
};

export default LikeButton;
