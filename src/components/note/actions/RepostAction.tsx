
import { useState } from 'react';
import { Repeat } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { nostrService } from "@/lib/nostr";
import { toast } from 'sonner';
import { useActionsContext } from './ActionsContext';

const RepostAction = () => {
  const [isReposted, setIsReposted] = useState(false);
  const { eventId, isLoggedIn, reposterPubkey, showRepostHeader } = useActionsContext();
  
  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isLoggedIn) {
      toast.error("You must be logged in to repost");
      return;
    }
    
    try {
      // Optimistically update UI
      setIsReposted(true);
      
      // Create repost event (kind 6)
      const event = {
        kind: 6, // Repost
        content: "", // Empty content for standard reposts
        tags: [
          ['e', eventId], // Reference to the post being reposted
        ]
      };
      
      const result = await nostrService.publishEvent(event);
      
      if (!result) {
        // If failed, revert UI
        setIsReposted(false);
        toast.error("Failed to repost");
      } else {
        toast.success("Post reposted");
      }
    } catch (error) {
      console.error("Error reposting:", error);
      setIsReposted(false);
      toast.error("Failed to repost");
    }
  };
  
  return (
    <Button 
      variant="ghost" 
      size="icon"
      className={`rounded-full hover:text-green-500 hover:bg-green-500/10 ${isReposted ? 'text-green-500' : ''}`}
      onClick={handleRepost}
      title="Repost"
      disabled={!!reposterPubkey && !showRepostHeader} // Disable if already a repost
    >
      <Repeat className="h-[18px] w-[18px]" />
    </Button>
  );
};

export default RepostAction;
