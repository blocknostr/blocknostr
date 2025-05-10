
import { Trash2 } from 'lucide-react';
import ActionButton from './ActionButton';

interface DeleteButtonProps {
  onClick: (e: React.MouseEvent) => void;
}

const DeleteButton = ({ onClick }: DeleteButtonProps) => {
  return (
    <ActionButton
      onClick={(e) => {
        if (e) e.preventDefault();
        onClick(e);
      }}
      icon={<Trash2 className="h-4 w-4" />}
      label="Delete post"
      activeClass="text-red-500"
      hoverClass="hover:text-red-500 group-hover:text-red-500"
    />
  );
};

export default DeleteButton;
