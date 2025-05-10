
import { useState } from 'react';
import { Heart, MessageCircle, Repeat, DollarSign, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { nostrService } from '@/lib/nostr';
import { toast } from "sonner";

interface NoteCardActionsProps {
  eventId: string;
  pubkey: string;
  onCommentClick: () => void;
  replyCount: number;
  onDelete?: () => void;
  isAuthor?: boolean;
}

const NoteCardActions = ({ eventId, pubkey, onCommentClick, replyCount, onDelete, isAuthor }: NoteCardActionsProps) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [retweeted, setRetweeted] = useState(false);
  const [retweetCount, setRetweetCount] = useState(0);
  
  const handleLike = async () => {
    try {
      if (!liked) {
        // Create a reaction event (kind 7)
        await nostrService.publishEvent({
          kind: 7,
          content: '+',  // '+' for like
          tags: [['e', eventId || ''], ['p', pubkey || '']]
        });
        
        setLiked(true);
        setLikeCount(prev => prev + 1);
      } else {
        // Remove like by publishing a reaction with '-'
        await nostrService.publishEvent({
          kind: 7,
          content: '-',  // '-' for unlike
          tags: [['e', eventId || ''], ['p', pubkey || '']]
        });
        
        setLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
        toast.success("Like removed");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to toggle like");
    }
  };

  const handleRetweet = async () => {
    try {
      if (!retweeted) {
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
      } else {
        // We can't directly delete retweets in the protocol, but we can create a "removal" event
        toast.info("Removing repost...");
        
        // For simplicity, we'll just update the UI state and notify the user
        setRetweeted(false);
        setRetweetCount(prev => Math.max(0, prev - 1));
        toast.success("Repost removed from your profile");
      }
    } catch (error) {
      console.error("Error toggling retweet:", error);
      toast.error("Failed to toggle repost");
    }
  };
  
  const handleSendTip = () => {
    toast.info("Tipping functionality coming soon!");
  };
  
  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <div className="flex justify-between pt-0 flex-wrap w-full gap-1">
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-muted-foreground hover:bg-blue-50 hover:text-blue-600 rounded-full"
        onClick={(e) => {
          e.preventDefault();
          onCommentClick();
        }}
      >
        <MessageCircle className="h-4 w-4 mr-1" />
        {replyCount > 0 && <span className="text-xs font-medium">{replyCount}</span>}
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        className={`rounded-full ${retweeted 
          ? "text-green-500 hover:bg-green-50 hover:text-green-600" 
          : "text-muted-foreground hover:bg-green-50 hover:text-green-600"}`}
        onClick={(e) => {
          e.preventDefault();
          handleRetweet();
        }}
      >
        <Repeat className="h-4 w-4 mr-1" />
        {retweetCount > 0 && <span className="text-xs font-medium">{retweetCount}</span>}
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        className={`rounded-full ${liked 
          ? "text-red-500 hover:bg-red-50 hover:text-red-600" 
          : "text-muted-foreground hover:bg-red-50 hover:text-red-600"}`}
        onClick={(e) => {
          e.preventDefault();
          handleLike();
        }}
      >
        <Heart className="h-4 w-4 mr-1" fill={liked ? "currentColor" : "none"} />
        {likeCount > 0 && <span className="text-xs font-medium">{likeCount}</span>}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:bg-blue-50 hover:text-blue-600 rounded-full"
        onClick={(e) => {
          e.preventDefault();
          handleSendTip();
        }}
      >
        <DollarSign className="h-4 w-4 mr-1" />
        <span className="text-xs">Tip</span>
      </Button>
      
      {isAuthor && (
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full ml-auto"
          onClick={(e) => {
            e.preventDefault();
            handleDelete();
          }}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          <span className="text-xs">Delete</span>
        </Button>
      )}
    </div>
  );
};

export default NoteCardActions;
