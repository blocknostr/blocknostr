
import { DollarSign } from 'lucide-react';
import ActionButton from './ActionButton';

interface TipButtonProps {
  onClick: () => void;
  tipCount: number;
}

const TipButton = ({ onClick, tipCount }: TipButtonProps) => {
  return (
    <ActionButton
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      icon={<DollarSign className="h-4 w-4" />}
      label="Send tip"
      count={tipCount}
      hoverClass="hover:bg-blue-50 hover:text-blue-600"
    />
  );
};

export default TipButton;
