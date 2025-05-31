
import { Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface DeleteButtonProps {
  onClick: (e: React.MouseEvent) => void;
}

const DeleteButton = ({ onClick }: DeleteButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full hover:text-red-500 hover:bg-red-500/10"
      onClick={onClick}
      title="Delete"
    >
      <Trash2 className="h-[18px] w-[18px]" />
    </Button>
  );
};

export default DeleteButton;

