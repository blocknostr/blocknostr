import React from 'react';
import { Repeat } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";
import { useAction } from '../hooks/use-action';

interface RepostButtonProps {
  eventId: string;
  pubkey: string;
  event: any;
}

const RepostButton: React.FC<RepostButtonProps> = ({
  eventId,
  pubkey,
  event
}) => {
  const [isReposted, setIsReposted] = React.useState(false);
  const [repostCount, setRepostCount] = React.useState(0);
  const { handleRepost, isReposting } = useAction({ 
    eventId, 
    authorPubkey: pubkey,
    event 
  });

  React.useEffect(() => {
    // Check if reposted
    // Placeholder for future implementation
    setIsReposted(false);

    // Get repost count
    // Placeholder for future implementation
    setRepostCount(0);
  }, [eventId]);

  const handleRepostClick = async () => {
    if (isReposting) return;
    
    try {
      await handleRepost();
      setIsReposted(true);
      setRepostCount(prev => prev + 1);
    } catch (error) {
      toast.error("Failed to repost note");
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon"
      className={`rounded-full hover:text-green-500 hover:bg-green-500/10 ${isReposted ? 'text-green-500' : ''}`}
      title="Repost"
      onClick={handleRepostClick}
      disabled={isReposting}
    >
      <Repeat className="h-[18px] w-[18px]" />
      {repostCount > 0 && <span className="ml-1 text-xs">{repostCount}</span>}
    </Button>
  );
};

export default RepostButton;
