
import { Heart } from 'lucide-react';
import ActionButton from './ActionButton';

interface LikeButtonProps {
  onClick: (e: React.MouseEvent) => void;
  liked: boolean;
  likeCount: number;
}

const LikeButton = ({ onClick, liked, likeCount }: LikeButtonProps) => {
  return (
    <ActionButton
      onClick={(e) => {
        e.preventDefault();
        onClick(e);
      }}
      icon={<Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />}
      label="Like"
      count={likeCount}
      active={liked}
      activeClass="text-pink-500"
      hoverClass="hover:text-pink-500 group-hover:text-pink-500"
    />
  );
};

export default LikeButton;
