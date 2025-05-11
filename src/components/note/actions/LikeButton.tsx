
import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { nostrService } from '@/lib/nostr';
import { useAction } from '../hooks/use-action';

interface LikeButtonProps {
  eventId: string;
  pubkey: string;
  event: any;
}

const LikeButton: React.FC<LikeButtonProps> = ({
  eventId,
  pubkey,
  event
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const { handleLike, isLiking } = useAction({ 
    eventId, 
    authorPubkey: pubkey,
    event 
  });

  useEffect(() => {
    // Check if liked - will be implemented in future
    setIsLiked(false);
    
    // Get like count
    // For now, just show 0
    setLikeCount(0);
  }, [eventId]);

  const handleLikeClick = async () => {
    if (isLiking) return;
    
    try {
      await handleLike();
      setIsLiked(true);
      setLikeCount(prev => prev + 1);
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon"
      className={`rounded-full hover:text-rose-500 hover:bg-rose-500/10 ${isLiked ? 'text-rose-500' : ''}`}
      title="Like"
      onClick={handleLikeClick}
      disabled={isLiking}
    >
      <Heart className="h-[18px] w-[18px]" />
      {likeCount > 0 && <span className="ml-1 text-xs">{likeCount}</span>}
    </Button>
  );
};

export default LikeButton;
