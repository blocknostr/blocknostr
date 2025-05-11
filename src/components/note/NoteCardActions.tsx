
import { useState, useEffect, useCallback } from 'react';
import { Heart, Repeat, MessageSquare, Share, Bookmark, Trash2, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { nostrService } from "@/lib/nostr";
import { toast } from 'sonner';
import { SimplePool } from 'nostr-tools';
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import ZapButton from '../post/ZapButton';

interface NoteCardActionsProps {
  eventId: string;
  pubkey: string;
  onCommentClick?: () => void;
  replyCount?: number;
  isAuthor?: boolean;
  onDelete?: () => void;
  reposterPubkey?: string | null;
  showRepostHeader?: boolean;
}

const NoteCardActions = ({ 
  eventId, 
  pubkey,
  onCommentClick,
  replyCount = 0,
  isAuthor = false,
  onDelete,
  reposterPubkey, 
  showRepostHeader
}: NoteCardActionsProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarkPending, setIsBookmarkPending] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [repostCount, setRepostCount] = useState(0);
  const [zapCount, setZapCount] = useState(0);
  const [zapAmount, setZapAmount] = useState(0);
  const [isZapped, setIsZapped] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const isLoggedIn = !!nostrService.publicKey;
  
  // Check bookmarked status and fetch reaction counts on mount
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (isLoggedIn) {
        const bookmarked = await nostrService.isBookmarked(eventId);
        setIsBookmarked(bookmarked);
      }
    };
    
    // Fetch reaction and repost counts using our new implementation
    const fetchReactionCounts = async () => {
      try {
        // Get all connected relays
        const relays = nostrService.getRelayStatus()
          .filter(relay => relay.status === 'connected')
          .map(relay => relay.url);
          
        if (relays.length === 0) {
          await nostrService.connectToDefaultRelays();
        }
        
        // Create a new SimplePool instance rather than accessing the private one
        const pool = new SimplePool();
        const counts = await nostrService.socialManager.getReactionCounts(
          pool,
          eventId,
          relays
        );
        
        // Update state with accurate counts
        setLikeCount(counts.likes);
        setRepostCount(counts.reposts);
        setIsLiked(counts.userHasLiked);
        setIsReposted(counts.userHasReposted);
        setZapCount(counts.zaps || 0);
        setZapAmount(counts.zapAmount || 0);
        setIsZapped(counts.userHasZapped || false);
        
      } catch (error) {
        console.error("Error fetching reaction counts:", error);
      }
    };
    
    checkBookmarkStatus();
    fetchReactionCounts();
  }, [eventId, isLoggedIn]);
  
  const handleLike = async () => {
    if (!isLoggedIn) {
      toast.error("You must be logged in to like posts");
      return;
    }
    
    try {
      // Optimistically update UI
      setIsLiked(true);
      setLikeCount(prev => prev + 1);
      
      // Create a new SimplePool instance
      const pool = new SimplePool();
      const result = await nostrService.socialManager.reactToEvent(
        pool,
        eventId,
        "+", // "+" means like per NIP-25
        nostrService.publicKey,
        null, // We don't store private keys
        nostrService.getRelayStatus()
          .filter(relay => relay.status === 'connected')
          .map(relay => relay.url),
        pubkey // Pass the pubkey of the event creator for proper NIP-25 implementation
      );
      
      if (!result) {
        // If failed, revert UI
        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
        toast.error("Failed to like post");
      }
    } catch (error) {
      console.error("Error liking post:", error);
      setIsLiked(false);
      setLikeCount(prev => Math.max(0, prev - 1));
      toast.error("Failed to like post");
    }
  };
  
  const handleRepost = async () => {
    if (!isLoggedIn) {
      toast.error("You must be logged in to repost");
      return;
    }
    
    try {
      // Optimistically update UI
      setIsReposted(true);
      setRepostCount(prev => prev + 1);
      
      // Create a new SimplePool instance
      const pool = new SimplePool();
      // Use our improved NIP-18 implementation
      const relayHint = nostrService.getRelayStatus()
        .filter(relay => relay.status === 'connected')
        .map(relay => relay.url)[0] || null;
        
      const result = await nostrService.socialManager.repostEvent(
        pool,
        eventId,
        pubkey,
        relayHint,
        nostrService.publicKey,
        null, // We don't store private keys
        nostrService.getRelayStatus()
          .filter(relay => relay.status === 'connected')
          .map(relay => relay.url)
      );
      
      if (!result) {
        // If failed, revert UI
        setIsReposted(false);
        setRepostCount(prev => Math.max(0, prev - 1));
        toast.error("Failed to repost");
      } else {
        toast.success("Post reposted");
      }
    } catch (error) {
      console.error("Error reposting:", error);
      setIsReposted(false);
      setRepostCount(prev => Math.max(0, prev - 1));
      toast.error("Failed to repost");
    }
  };
  
  // Handle zap
  const handleZap = (amount: number) => {
    // Update UI optimistically
    setIsZapped(true);
    setZapCount(prev => prev + 1);
    setZapAmount(prev => prev + amount);
    
    // In a real implementation, this would connect to a Lightning wallet
    console.log(`Zapping ${amount} sats to ${pubkey} for event ${eventId}`);
  };
  
  // Use useCallback to prevent unnecessary recreations of the function
  const handleBookmark = useCallback(async (e: React.MouseEvent) => {
    // Prevent event bubbling to parent elements
    e.stopPropagation();
    
    if (!isLoggedIn) {
      toast.error("You must be logged in to bookmark posts");
      return;
    }
    
    // If an operation is already pending, don't allow another one
    if (isBookmarkPending) {
      return;
    }
    
    try {
      setIsBookmarkPending(true);
      
      if (isBookmarked) {
        // Remove bookmark
        setIsBookmarked(false); // Optimistically update UI
        const result = await nostrService.removeBookmark(eventId);
        if (result) {
          toast.success("Bookmark removed");
        } else {
          setIsBookmarked(true); // Revert if failed
          toast.error("Failed to remove bookmark");
        }
      } else {
        // Add bookmark
        setIsBookmarked(true); // Optimistically update UI
        const result = await nostrService.addBookmark(eventId);
        if (result) {
          toast.success("Post bookmarked");
        } else {
          setIsBookmarked(false); // Revert if failed
          toast.error("Failed to bookmark post");
        }
      }
    } catch (error) {
      console.error("Error bookmarking post:", error);
      setIsBookmarked(!isBookmarked); // Revert UI state
      toast.error("Failed to update bookmark");
    } finally {
      setIsBookmarkPending(false);
    }
  }, [eventId, isBookmarked, isLoggedIn, isBookmarkPending]);
  
  // Handle comment click with event stopping
  const handleCommentButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCommentClick) {
      onCommentClick();
    }
  };
  
  // Handle delete click with event stopping
  const handleDeleteButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };
  
  // Toggle detailed stats
  const toggleStats = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowStats(!showStats);
  };
  
  return (
    <div className="pt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-5">
          <Button 
            variant="ghost" 
            size="icon" 
            className={`rounded-full hover:text-primary hover:bg-primary/10 ${isLiked ? 'text-primary' : ''}`}
            onClick={handleLike}
            title="Like"
          >
            <Heart className="h-[18px] w-[18px]" />
            {likeCount > 0 && (
              <span className="ml-1 text-xs">{likeCount}</span>
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            className={`rounded-full hover:text-green-500 hover:bg-green-500/10 ${isReposted ? 'text-green-500' : ''}`}
            onClick={handleRepost}
            title="Repost"
            disabled={!!reposterPubkey && !showRepostHeader} // Disable if already a repost
          >
            <Repeat className="h-[18px] w-[18px]" />
            {repostCount > 0 && (
              <span className="ml-1 text-xs">{repostCount}</span>
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full hover:text-blue-500 hover:bg-blue-500/10"
            onClick={handleCommentButtonClick}
            title="Reply"
          >
            <MessageSquare className="h-[18px] w-[18px]" />
            {replyCount > 0 && (
              <span className="ml-1 text-xs">{replyCount}</span>
            )}
          </Button>
          
          <ZapButton
            eventId={eventId}
            pubkey={pubkey}
            zapCount={zapCount}
            zapAmount={zapAmount}
            userHasZapped={isZapped}
            onZap={handleZap}
          />
          
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className={`rounded-full hover:text-yellow-500 hover:bg-yellow-500/10 ${isBookmarked ? 'text-yellow-500' : ''}`}
                title="Bookmark"
                onClick={handleBookmark}
                disabled={isBookmarkPending}
              >
                <Bookmark className="h-[18px] w-[18px]" />
              </Button>
            </ContextMenuTrigger>
            <ContextMenuContent onClick={(e) => e.stopPropagation()}>
              <ContextMenuItem onClick={(e) => {
                e.preventDefault();
                handleBookmark(e as unknown as React.MouseEvent);
              }}>
                {isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
          
          {isAuthor && (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:text-red-500 hover:bg-red-500/10"
              onClick={handleDeleteButtonClick}
              title="Delete"
            >
              <Trash2 className="h-[18px] w-[18px]" />
            </Button>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-muted-foreground"
            onClick={toggleStats}
          >
            {showStats ? 'Hide Stats' : 'Stats'}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full hover:text-primary hover:bg-primary/10"
            title="Share"
          >
            <Share className="h-[18px] w-[18px]" />
          </Button>
        </div>
      </div>
      
      {showStats && (
        <div className="mt-2 p-3 bg-muted/30 rounded-md text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-muted-foreground">Likes</div>
              <div className="font-medium">{likeCount}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Reposts</div>
              <div className="font-medium">{repostCount}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Replies</div>
              <div className="font-medium">{replyCount}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Zaps</div>
              <div className="font-medium">
                {zapCount} {zapAmount > 0 && `(${zapAmount.toLocaleString()} sats)`}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteCardActions;
