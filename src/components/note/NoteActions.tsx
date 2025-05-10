
import { useState } from 'react';
import { Heart, MessageCircle, Repeat, Share, Bookmark } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { NostrEvent, nostrService } from "@/lib/nostr";
import { toast } from "sonner";

interface NoteActionsProps {
  event: NostrEvent;
  onToggleComments: () => void;
  replyCount: number;
}

const NoteActions = ({ event, onToggleComments, replyCount }: NoteActionsProps) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [retweeted, setRetweeted] = useState(false);
  const [retweetCount, setRetweetCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  
  const handleLike = async () => {
    if (!liked) {
      // Create a reaction event (kind 7)
      await nostrService.publishEvent({
        kind: 7,
        content: '+',  // '+' for like
        tags: [['e', event.id || ''], ['p', event.pubkey || '']]
      });
      
      setLiked(true);
      setLikeCount(prev => prev + 1);
      toast.success("Post liked");
    } else {
      setLiked(false);
      setLikeCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleRetweet = async () => {
    if (!retweeted) {
      try {
        // Create a repost event
        await nostrService.publishEvent({
          kind: 6, // Repost kind
          content: JSON.stringify({
            event: event
          }),
          tags: [
            ['e', event.id || ''], // Reference to original note
            ['p', event.pubkey || ''] // Original author
          ]
        });
        
        setRetweeted(true);
        setRetweetCount(prev => prev + 1);
        toast.success("Post reposted");
      } catch (error) {
        console.error("Error reposting:", error);
        toast.error("Failed to repost");
      }
    } else {
      setRetweeted(false);
      setRetweetCount(prev => Math.max(0, prev - 1));
    }
  };
  
  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    toast.success(bookmarked ? "Removed from bookmarks" : "Added to bookmarks");
  };
  
  const handleSendTip = () => {
    toast.info("Tipping functionality coming soon!");
  };

  return (
    <div className="flex justify-between mt-3 max-w-md">
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-full p-2 h-8"
        onClick={onToggleComments}
      >
        <MessageCircle className="h-4 w-4" />
        <span className="ml-1 text-xs">{replyCount > 0 ? replyCount : ''}</span>
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        className={`hover:text-green-500 hover:bg-green-500/10 rounded-full p-2 h-8 ${retweeted ? "text-green-500" : "text-muted-foreground"}`}
        onClick={handleRetweet}
      >
        <Repeat className="h-4 w-4" />
        <span className="ml-1 text-xs">{retweetCount > 0 ? retweetCount : ''}</span>
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        className={`hover:text-pink-500 hover:bg-pink-500/10 rounded-full p-2 h-8 ${liked ? "text-pink-500" : "text-muted-foreground"}`}
        onClick={handleLike}
      >
        <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
        <span className="ml-1 text-xs">{likeCount > 0 ? likeCount : ''}</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className={`hover:text-blue-500 hover:bg-blue-500/10 rounded-full p-2 h-8 ${bookmarked ? "text-blue-500" : "text-muted-foreground"}`}
        onClick={handleBookmark}
      >
        <Bookmark className="h-4 w-4" fill={bookmarked ? "currentColor" : "none"} />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-full p-2 h-8"
        onClick={handleSendTip}
      >
        <Share className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default NoteActions;
