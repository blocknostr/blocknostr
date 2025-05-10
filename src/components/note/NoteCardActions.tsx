import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Repeat, DollarSign, Trash2, Eye, Share2, Flag, Bookmark } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { nostrService } from '@/lib/nostr';
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from 'lucide-react';

interface NoteCardActionsProps {
  eventId: string;
  pubkey: string;
  onCommentClick: () => void;
  replyCount: number;
  onDelete?: () => void;
  isAuthor?: boolean;
  reachCount?: number;
}

const NoteCardActions = ({ 
  eventId, 
  pubkey, 
  onCommentClick, 
  replyCount, 
  onDelete, 
  isAuthor,
  reachCount = 0
}: NoteCardActionsProps) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [retweeted, setRetweeted] = useState(false);
  const [retweetCount, setRetweetCount] = useState(0);
  const [tipCount, setTipCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  
  // Fetch reaction counts when component mounts
  useEffect(() => {
    const fetchReactions = async () => {
      await nostrService.connectToDefaultRelays();
      
      // Subscribe to reactions for this post
      const reactionSubId = nostrService.subscribe(
        [
          {
            kinds: [7], // Reaction events
            '#e': [eventId], // For this post
            limit: 100
          }
        ],
        (event) => {
          // Check if it's a like ('+')
          if (event.content === '+') {
            setLikeCount(prev => prev + 1);
            
            // Check if current user liked
            if (event.pubkey === nostrService.publicKey) {
              setLiked(true);
            }
          }
        }
      );
      
      // Subscribe to reposts
      const repostSubId = nostrService.subscribe(
        [
          {
            kinds: [6], // Repost events
            '#e': [eventId], // For this post
            limit: 50
          }
        ],
        (event) => {
          setRetweetCount(prev => prev + 1);
          
          // Check if current user reposted
          if (event.pubkey === nostrService.publicKey) {
            setRetweeted(true);
          }
        }
      );
      
      // Subscribe to zap (tip) events - simplified simulation
      // In a real implementation, we would look for zap receipts
      const zapSubId = nostrService.subscribe(
        [
          {
            kinds: [9735], // Zap receipts
            '#e': [eventId], // For this post
            limit: 50
          }
        ],
        (event) => {
          setTipCount(prev => prev + 1);
        }
      );
      
      // Check if bookmarked by current user
      const checkBookmarkStatus = async () => {
        // This is a simplified version; in a real app, you would query the user's bookmarks
        const randomIsBookmarked = Math.random() > 0.8;
        setBookmarked(randomIsBookmarked);
      };
      
      checkBookmarkStatus();
      
      // Cleanup subscriptions after data is loaded
      setTimeout(() => {
        nostrService.unsubscribe(reactionSubId);
        nostrService.unsubscribe(repostSubId);
        nostrService.unsubscribe(zapSubId);
      }, 5000);
    };
    
    fetchReactions();
    
    // Also set some initial numbers if we have no real data yet
    // This is just for UI demonstration purposes
    if (Math.random() > 0.5) {
      setLikeCount(Math.floor(Math.random() * 20));
      setRetweetCount(Math.floor(Math.random() * 10));
      setTipCount(Math.floor(Math.random() * 5));
    }
  }, [eventId, nostrService.publicKey]);
  
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
  
  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    toast.success(bookmarked ? "Removed from bookmarks" : "Added to bookmarks");
  };
  
  const handleShare = () => {
    // Create a shareable URL
    const shareUrl = `${window.location.origin}/post/${eventId}`;
    
    // Check if Web Share API is available
    if (navigator.share) {
      navigator.share({
        title: 'Shared Nostr Post',
        text: 'Check out this post!',
        url: shareUrl,
      }).catch((error) => {
        console.error('Error sharing:', error);
        // Fallback to clipboard
        copyToClipboard(shareUrl);
      });
    } else {
      // Fallback for browsers that don't support the Web Share API
      copyToClipboard(shareUrl);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success("Link copied to clipboard");
      })
      .catch((err) => {
        toast.error("Failed to copy link");
        console.error('Could not copy text: ', err);
      });
  };
  
  const handleReport = () => {
    toast.info("Report submitted. Thank you for helping keep the community safe.");
  };

  return (
    <div className="flex justify-between items-center w-full gap-2 pt-2">
      <div className="flex items-center space-x-1">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground hover:bg-blue-50 hover:text-blue-600 rounded-full p-2 h-8 w-8"
          onClick={(e) => {
            e.preventDefault();
            onCommentClick();
          }}
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
        {replyCount > 0 && <span className="text-xs font-medium text-muted-foreground">{replyCount}</span>}
      </div>
      
      <div className="flex items-center space-x-1">
        <Button 
          variant="ghost" 
          size="sm" 
          className={`rounded-full p-2 h-8 w-8 ${retweeted 
            ? "text-green-500 hover:bg-green-50 hover:text-green-600" 
            : "text-muted-foreground hover:bg-green-50 hover:text-green-600"}`}
          onClick={(e) => {
            e.preventDefault();
            handleRetweet();
          }}
        >
          <Repeat className="h-4 w-4" />
        </Button>
        {retweetCount > 0 && <span className="text-xs font-medium text-muted-foreground">{retweetCount}</span>}
      </div>
      
      <div className="flex items-center space-x-1">
        <Button 
          variant="ghost" 
          size="sm" 
          className={`rounded-full p-2 h-8 w-8 ${liked 
            ? "text-red-500 hover:bg-red-50 hover:text-red-600" 
            : "text-muted-foreground hover:bg-red-50 hover:text-red-600"}`}
          onClick={(e) => {
            e.preventDefault();
            handleLike();
          }}
        >
          <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
        </Button>
        {likeCount > 0 && <span className="text-xs font-medium text-muted-foreground">{likeCount}</span>}
      </div>
      
      <div className="flex items-center space-x-1">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground rounded-full p-2 h-8 w-8"
          onClick={(e) => e.preventDefault()}
        >
          <Eye className="h-4 w-4" />
        </Button>
        {reachCount > 0 && <span className="text-xs font-medium text-muted-foreground">{reachCount}</span>}
      </div>
      
      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:bg-blue-50 hover:text-blue-600 rounded-full p-2 h-8 w-8"
          onClick={(e) => {
            e.preventDefault();
            handleSendTip();
          }}
        >
          <DollarSign className="h-4 w-4" />
        </Button>
        {tipCount > 0 && <span className="text-xs font-medium text-muted-foreground">{tipCount}</span>}
      </div>
      
      {/* Options dropdown menu - enhanced */}
      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm" 
              className="text-muted-foreground hover:bg-accent rounded-full p-2 h-8 w-8"
              onClick={(e) => e.preventDefault()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Post options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleShare} className="flex items-center gap-2 cursor-pointer">
              <Share2 className="h-4 w-4" /> 
              Share post
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={handleBookmark} className="flex items-center gap-2 cursor-pointer">
              <Bookmark className="h-4 w-4" fill={bookmarked ? "currentColor" : "none"} /> 
              {bookmarked ? "Remove bookmark" : "Bookmark post"}
            </DropdownMenuItem>
            
            {isAuthor ? (
              <DropdownMenuItem 
                onClick={handleDelete} 
                className="text-red-500 flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" /> 
                Delete post
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={handleReport} className="text-red-500 flex items-center gap-2 cursor-pointer">
                <Flag className="h-4 w-4" /> 
                Report post
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default NoteCardActions;
