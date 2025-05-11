
import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { nostrService } from "@/lib/nostr";
import { toast } from 'sonner';
import { SimplePool } from 'nostr-tools';

interface LikeButtonProps {
  eventId: string;
  pubkey: string;
  likeCount: number;
  isLiked: boolean;
  onLike: (liked: boolean) => void;
}

const LikeButton = ({ 
  eventId, 
  pubkey, 
  likeCount, 
  isLiked, 
  onLike 
}: LikeButtonProps) => {
  const isLoggedIn = !!nostrService.publicKey;
  
  const handleLike = async () => {
    if (!isLoggedIn) {
      toast.error("You must be logged in to like posts");
      return;
    }
    
    try {
      // Optimistically update UI
      onLike(true);
      
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
        onLike(false);
        toast.error("Failed to like post");
      }
    } catch (error) {
      console.error("Error liking post:", error);
      onLike(false);
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
      {likeCount > 0 && (
        <span className="ml-1 text-xs">{likeCount}</span>
      )}
    </Button>
  );
};

export default LikeButton;
