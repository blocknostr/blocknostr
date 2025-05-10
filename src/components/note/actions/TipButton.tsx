
import { DollarSign } from 'lucide-react';
import ActionButton from './ActionButton';

interface TipButtonProps {
  onClick: () => void;
  tipCount?: number;
}

const TipButton = ({ onClick, tipCount }: TipButtonProps) => {
  return (
    <ActionButton
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      icon={<DollarSign className="h-4 w-4" />}
      label="Tip"
      count={tipCount && tipCount > 0 ? tipCount : undefined}
      hoverClass="hover:text-blue-500 group-hover:text-blue-500"
    />
  );
};

export default TipButton;
