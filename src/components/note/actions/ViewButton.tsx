
import { Eye } from 'lucide-react';
import ActionButton from './ActionButton';

interface ViewButtonProps {
  reachCount: number;
}

const ViewButton = ({ reachCount }: ViewButtonProps) => {
  return (
    <ActionButton
      onClick={(e) => e.preventDefault()}
      icon={<Eye className="h-4 w-4" />}
      label="Views"
      count={reachCount}
      hoverClass="hover:bg-gray-100"
    />
  );
};

export default ViewButton;
