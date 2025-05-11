
import { Share } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface ShareButtonProps {
  onClick?: (e: React.MouseEvent) => void;
}

const ShareButton = ({ onClick }: ShareButtonProps) => {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="rounded-full hover:text-primary hover:bg-primary/10"
      title="Share"
      onClick={handleClick}
    >
      <Share className="h-[18px] w-[18px]" />
    </Button>
  );
};

export default ShareButton;
