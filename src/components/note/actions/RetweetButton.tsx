
import { Repeat } from 'lucide-react';
import ActionButton from './ActionButton';

interface RetweetButtonProps {
  onClick: (e?: React.MouseEvent) => void;
  retweeted: boolean;
  retweetCount: number;
}

const RetweetButton = ({ onClick, retweeted, retweetCount }: RetweetButtonProps) => {
  return (
    <ActionButton
      onClick={(e) => {
        if (e) e.preventDefault();
        onClick(e);
      }}
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
