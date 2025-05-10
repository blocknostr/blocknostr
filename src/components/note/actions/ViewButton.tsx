
import { BarChart2 } from 'lucide-react';
import ActionButton from './ActionButton';

interface ViewButtonProps {
  reachCount: number;
}

const ViewButton = ({ reachCount }: ViewButtonProps) => {
  return (
    <ActionButton
      onClick={() => {}} // No action required, just a display component
      icon={<BarChart2 className="h-4 w-4" />}
      label="Analytics"
      count={reachCount > 0 ? reachCount : undefined}
      hoverClass="hover:text-blue-500 group-hover:text-blue-500"
    />
  );
};

export default ViewButton;
