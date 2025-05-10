
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { nostrService } from "@/lib/nostr";
import { useToast } from "@/components/ui/use-toast";
import { Heart, MessageCircle, Repeat, Share, ThumbsDown } from "lucide-react";
import { Link } from "react-router-dom";

interface NoteCardActionsProps {
  eventId: string;
  reposted?: boolean;
  liked?: boolean;
  disliked?: boolean;
  showReplyButton?: boolean;
}

const NoteCardActions = ({ 
  eventId, 
  reposted = false, 
  liked = false, 
  disliked = false,
  showReplyButton = true
}: NoteCardActionsProps) => {
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(liked);
  const [isDisliked, setIsDisliked] = useState(disliked);
  const [isReposted, setIsReposted] = useState(reposted);
  const isLoggedIn = !!nostrService.publicKey;
  
  const handleLike = async () => {
    if (!isLoggedIn) {
      toast({
        title: "Login required",
        description: "You need to log in to like posts"
      });
      return;
    }
    
    // First connect to relays
    await nostrService.connectToRelays();
    
    // Create and publish like event
    try {
      const event = {
        kind: 7, // Reaction
        tags: [
          ['e', eventId], // reference to the note
        ],
        content: '+' // '+' for like
      };
      
      const success = await nostrService.publishEvent(event);
      
      if (success) {
        // Toggle like state
        setIsLiked(!isLiked);
        if (isDisliked) setIsDisliked(false);
        
        toast({
          title: isLiked ? "Like removed" : "Post liked",
          duration: 1500
        });
      }
    } catch (error) {
      console.error("Error liking post:", error);
      toast({
        title: "Error",
        description: "Failed to like post",
        variant: "destructive"
      });
    }
  };
  
  const handleDislike = async () => {
    if (!isLoggedIn) {
      toast({
        title: "Login required",
        description: "You need to log in to interact with posts"
      });
      return;
    }
    
    // First connect to relays
    await nostrService.connectToRelays();
    
    // Create and publish dislike event
    try {
      const event = {
        kind: 7, // Reaction
        tags: [
          ['e', eventId], // reference to the note
        ],
        content: '-' // '-' for dislike
      };
      
      const success = await nostrService.publishEvent(event);
      
      if (success) {
        // Toggle dislike state
        setIsDisliked(!isDisliked);
        if (isLiked) setIsLiked(false);
        
        toast({
          title: isDisliked ? "Dislike removed" : "Post disliked",
          duration: 1500
        });
      }
    } catch (error) {
      console.error("Error disliking post:", error);
      toast({
        title: "Error",
        description: "Failed to dislike post",
        variant: "destructive"
      });
    }
  };
  
  const handleRepost = async () => {
    if (!isLoggedIn) {
      toast({
        title: "Login required",
        description: "You need to log in to repost"
      });
      return;
    }
    
    // First connect to relays
    await nostrService.connectToRelays();
    
    try {
      // Create repost event
      const event = {
        kind: 6, // Repost
        tags: [
          ['e', eventId],  // reference to the original note
        ],
        content: '' // Empty content for simple repost
      };
      
      const success = await nostrService.publishEvent(event);
      
      if (success) {
        setIsReposted(true);
        toast({
          title: "Post reposted",
          description: "The post has been reposted to your profile",
          duration: 2000
        });
      }
    } catch (error) {
      console.error("Error reposting:", error);
      toast({
        title: "Error",
        description: "Failed to repost",
        variant: "destructive"
      });
    }
  };
  
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Shared via BlockNostr',
          text: 'Check out this post on BlockNostr',
          url: `${window.location.origin}/note/${eventId}`
        });
      } else {
        // Fallback to copying the URL
        await navigator.clipboard.writeText(`${window.location.origin}/note/${eventId}`);
        toast({
          title: "Link copied",
          description: "Post link copied to clipboard"
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
      // Silently handle share rejection
    }
  };
  
  return (
    <div className="flex justify-between mt-2">
      {showReplyButton && (
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/note/${eventId}`}>
            <MessageCircle className="h-4 w-4 mr-1" />
            <span className="text-xs">Reply</span>
          </Link>
        </Button>
      )}
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleRepost} 
        disabled={isReposted}
        className={isReposted ? "text-green-600" : ""}
      >
        <Repeat className="h-4 w-4 mr-1" />
        <span className="text-xs">
          {isReposted ? "Reposted" : "Repost"}
        </span>
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleLike}
        className={isLiked ? "text-red-600" : ""}
      >
        <Heart className={`h-4 w-4 mr-1 ${isLiked ? "fill-red-600" : ""}`} />
        <span className="text-xs">
          {isLiked ? "Liked" : "Like"}
        </span>
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleDislike}
        className={isDisliked ? "text-blue-600" : ""}
      >
        <ThumbsDown className={`h-4 w-4 mr-1 ${isDisliked ? "fill-blue-600" : ""}`} />
        <span className="text-xs">
          {isDisliked ? "Disliked" : "Dislike"}
        </span>
      </Button>
      
      <Button variant="ghost" size="sm" onClick={handleShare}>
        <Share className="h-4 w-4 mr-1" />
        <span className="text-xs">Share</span>
      </Button>
    </div>
  );
};

export default NoteCardActions;
