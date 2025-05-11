
import { useState, useEffect } from 'react';
import { nostrService } from "@/lib/nostr";
import { SimplePool } from 'nostr-tools';
import ZapButton from '../post/ZapButton';
import { 
  LikeButton, 
  RepostButton, 
  CommentButton, 
  BookmarkButton,
  DeleteButton,
  ShareButton,
  StatsButton,
  StatsDisplay
} from './actions';

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
  
  const handleLike = (liked: boolean) => {
    setIsLiked(liked);
    setLikeCount(prev => liked ? prev + 1 : Math.max(0, prev - 1));
  };
  
  const handleRepost = (reposted: boolean) => {
    setIsReposted(reposted);
    setRepostCount(prev => reposted ? prev + 1 : Math.max(0, prev - 1));
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
          <LikeButton 
            eventId={eventId}
            pubkey={pubkey}
            likeCount={likeCount}
            isLiked={isLiked}
            onLike={handleLike}
          />
          
          <RepostButton 
            eventId={eventId}
            pubkey={pubkey}
            repostCount={repostCount}
            isReposted={isReposted}
            reposterPubkey={reposterPubkey}
            showRepostHeader={showRepostHeader}
            onRepost={handleRepost}
          />
          
          <CommentButton 
            replyCount={replyCount}
            onClick={handleCommentButtonClick}
          />
          
          <ZapButton
            eventId={eventId}
            pubkey={pubkey}
            zapCount={zapCount}
            zapAmount={zapAmount}
            userHasZapped={isZapped}
            onZap={handleZap}
          />
          
          <BookmarkButton 
            eventId={eventId}
            isBookmarked={isBookmarked}
            setIsBookmarked={setIsBookmarked}
          />
          
          {isAuthor && (
            <DeleteButton onClick={handleDeleteButtonClick} />
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <StatsButton 
            showStats={showStats}
            onClick={toggleStats}
          />
          
          <ShareButton />
        </div>
      </div>
      
      {showStats && (
        <StatsDisplay
          likeCount={likeCount}
          repostCount={repostCount}
          replyCount={replyCount}
          zapCount={zapCount}
          zapAmount={zapAmount}
        />
      )}
    </div>
  );
};

export default NoteCardActions;
