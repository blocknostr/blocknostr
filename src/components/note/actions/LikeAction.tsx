
import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { nostrService } from "@/lib/nostr";
import { toast } from 'sonner';
import { useActionsContext } from './ActionsContext';

const LikeAction = () => {
  const [isLiked, setIsLiked] = useState(false);
  const { eventId, isLoggedIn } = useActionsContext();
  
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isLoggedIn) {
      toast.error("You must be logged in to like posts");
      return;
    }
    
    try {
      // Optimistically update UI
      setIsLiked(true);
      
      // Create and publish reaction event
      const event = {
        kind: 7, // Reaction
        content: "+", // "+" means like
        tags: [
          ['e', eventId], // Reference to the post being liked
        ]
      };
      
      const result = await nostrService.publishEvent(event);
      
      if (!result) {
        // If failed, revert UI
        setIsLiked(false);
        toast.error("Failed to like post");
      }
    } catch (error) {
      console.error("Error liking post:", error);
      setIsLiked(false);
      toast.error("Failed to like post");
    }
  };
  
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className={`rounded-full hover:text-primary hover:bg-primary/10 ${isLiked ? 'text-primary' : ''}`}
      onClick={handleLike}
      title="Like"
    >
      <Heart className="h-[18px] w-[18px]" />
    </Button>
  );
};

export default LikeAction;
