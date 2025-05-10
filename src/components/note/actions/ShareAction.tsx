
import { Share } from 'lucide-react';
import { Button } from "@/components/ui/button";

const ShareAction = () => {
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Share functionality could be implemented here
  };
  
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="rounded-full hover:text-primary hover:bg-primary/10"
      onClick={handleShare}
      title="Share"
    >
      <Share className="h-[18px] w-[18px]" />
    </Button>
  );
};

export default ShareAction;
