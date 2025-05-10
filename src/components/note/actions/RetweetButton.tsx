
import { Repeat } from 'lucide-react';
import ActionButton from './ActionButton';

interface RetweetButtonProps {
  onClick: () => void;
  retweeted: boolean;
  retweetCount: number;
}

const RetweetButton = ({ onClick, retweeted, retweetCount }: RetweetButtonProps) => {
  return (
    <ActionButton
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      icon={<Repeat className="h-4 w-4" />}
      label="Repost"
      count={retweetCount}
      active={retweeted}
      activeClass="text-green-500"
      hoverClass="hover:bg-green-50 hover:text-green-600"
    />
  );
};

export default RetweetButton;
