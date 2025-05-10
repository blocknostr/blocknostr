
import { useState } from 'react';
import { Heart, MessageCircle, Repeat, DollarSign } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { nostrService } from '@/lib/nostr';
import { toast } from "sonner";

interface NoteCardActionsProps {
  eventId: string;
  pubkey: string;
  onCommentClick: () => void;
  replyCount: number;
}

const NoteCardActions = ({ eventId, pubkey, onCommentClick, replyCount }: NoteCardActionsProps) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [retweeted, setRetweeted] = useState(false);
  const [retweetCount, setRetweetCount] = useState(0);
  
  const handleLike = async () => {
    if (!liked) {
      // Create a reaction event (kind 7)
      await nostrService.publishEvent({
        kind: 7,
        content: '+',  // '+' for like
        tags: [['e', eventId || ''], ['p', pubkey || '']]
      });
      
      setLiked(true);
      setLikeCount(prev => prev + 1);
    }
  };

  const handleRetweet = async () => {
    if (!retweeted) {
      try {
        // Create a repost event
        await nostrService.publishEvent({
          kind: 6, // Repost kind
          content: JSON.stringify({
            event: { id: eventId, pubkey }
          }),
          tags: [
            ['e', eventId || ''], // Reference to original note
            ['p', pubkey || ''] // Original author
          ]
        });
        
        setRetweeted(true);
        setRetweetCount(prev => prev + 1);
        toast.success("Note reposted successfully");
      } catch (error) {
        console.error("Error reposting:", error);
        toast.error("Failed to repost note");
      }
    }
  };
  
  const handleSendTip = () => {
    toast.info("Tipping functionality coming soon!");
  };

  return (
    <div className="flex justify-between pt-0 flex-wrap">
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-muted-foreground"
        onClick={onCommentClick}
      >
        <MessageCircle className="h-4 w-4 mr-1" />
        {replyCount > 0 ? replyCount : ''}
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        className={retweeted ? "text-green-500" : "text-muted-foreground"}
        onClick={handleRetweet}
      >
        <Repeat className="h-4 w-4 mr-1" />
        {retweetCount > 0 ? retweetCount : ''}
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        className={liked ? "text-red-500" : "text-muted-foreground"}
        onClick={handleLike}
      >
        <Heart className="h-4 w-4 mr-1" fill={liked ? "currentColor" : "none"} />
        {likeCount > 0 ? likeCount : ''}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={handleSendTip}
      >
        <DollarSign className="h-4 w-4 mr-1" />
        Tip
      </Button>
    </div>
  );
};

export default NoteCardActions;
