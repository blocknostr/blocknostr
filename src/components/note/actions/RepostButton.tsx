
import { Repeat } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { nostrService } from "@/lib/nostr";
import { toast } from 'sonner';
import { SimplePool } from 'nostr-tools';

interface RepostButtonProps {
  eventId: string;
  pubkey: string;
  repostCount: number;
  isReposted: boolean;
  reposterPubkey?: string | null;
  showRepostHeader?: boolean;
  onRepost: (reposted: boolean) => void;
}

const RepostButton = ({ 
  eventId, 
  pubkey, 
  repostCount, 
  isReposted, 
  reposterPubkey, 
  showRepostHeader,
  onRepost 
}: RepostButtonProps) => {
  const isLoggedIn = !!nostrService.publicKey;
  
  const handleRepost = async () => {
    if (!isLoggedIn) {
      toast.error("You must be logged in to repost");
      return;
    }
    
    try {
      // Optimistically update UI
      onRepost(true);
      
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
        onRepost(false);
        toast.error("Failed to repost");
      } else {
        toast.success("Post reposted");
      }
    } catch (error) {
      console.error("Error reposting:", error);
      onRepost(false);
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
      {repostCount > 0 && (
        <span className="ml-1 text-xs">{repostCount}</span>
      )}
    </Button>
  );
};

export default RepostButton;
