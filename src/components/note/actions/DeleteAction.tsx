
import { Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useActionsContext } from './ActionsContext';

interface DeleteActionProps {
  onDelete?: (e: React.MouseEvent) => void;
}

const DeleteAction = ({ onDelete }: DeleteActionProps) => {
  const { isAuthor } = useActionsContext();
  
  if (!isAuthor) {
    return null;
  }
  
  const handleDeleteButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(e);
    }
  };
  
  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full hover:text-red-500 hover:bg-red-500/10"
      onClick={handleDeleteButtonClick}
      title="Delete"
    >
      <Trash2 className="h-[18px] w-[18px]" />
    </Button>
  );
};

export default DeleteAction;
