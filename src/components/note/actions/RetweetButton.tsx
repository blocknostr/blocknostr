
import { Repeat } from 'lucide-react';
import ActionButton from './ActionButton';

interface RetweetButtonProps {
  onClick: () => void;
  retweeted: boolean;
  retweetCount: number;
  onRetweetStatusChange?: (isRetweeted: boolean) => void;
}

const RetweetButton = ({ onClick, retweeted, retweetCount, onRetweetStatusChange }: RetweetButtonProps) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick();
    if (onRetweetStatusChange) {
      // Pass the expected new status (opposite of current)
      onRetweetStatusChange(!retweeted);
    }
  };

  return (
    <ActionButton
      onClick={handleClick}
      icon={<Repeat className="h-4 w-4" />}
      label="Repost"
      count={retweetCount}
      active={retweeted}
      activeClass="text-green-500"
      hoverClass="hover:text-green-500 group-hover:text-green-500"
    />
  );
};

export default RetweetButton;
