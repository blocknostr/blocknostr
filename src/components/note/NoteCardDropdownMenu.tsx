
import { MoreHorizontal, Twitter, Flag, UserPlus, Mail } from 'lucide-react';
import { Button } from "../ui/button";
import { nostrService } from '@/lib/nostr';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface NoteCardDropdownMenuProps {
  eventId: string;
  pubkey: string;
  onDeleteClick: () => void;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

const NoteCardDropdownMenu = ({ 
  eventId, 
  pubkey, 
  onDeleteClick,
  onInteractionStart,
  onInteractionEnd
}: NoteCardDropdownMenuProps) => {
  const navigate = useNavigate();
  const isOwnPost = pubkey === nostrService.publicKey;
  
  const handleViewDetails = () => {
    if (eventId) {
      navigate(`/post/${eventId}`);
    }
  };
  
  const handleCopyLink = () => {
    if (eventId) {
      const url = `${window.location.origin}/post/${eventId}`;
      navigator.clipboard.writeText(url)
        .then(() => {
          toast.success('Link copied to clipboard');
        })
        .catch(err => {
          console.error('Failed to copy link:', err);
          toast.error('Failed to copy link');
        });
    }
  };

  const handleShareToTwitter = () => {
    const url = `${window.location.origin}/post/${eventId}`;
    const text = `Check out this post on BlockNoster`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank');
  };

  const handleFollow = () => {
    if (pubkey && pubkey !== nostrService.publicKey) {
      nostrService.followUser(pubkey)
        .then(() => {
          toast.success('User followed successfully');
        })
        .catch((error) => {
          console.error('Error following user:', error);
          toast.error('Failed to follow user');
        });
    }
  };

  const handleShareViaDM = () => {
    // For now, navigate to messages with the event pre-filled
    if (pubkey) {
      navigate(`/messages?recipient=${pubkey}&reference=${eventId}`);
    }
  };

  const handleReport = () => {
    toast.info('Report functionality coming soon');
  };

  return (
    <div className="absolute top-2 right-2 z-10">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto rounded-full hover:bg-accent/50"
            onMouseEnter={onInteractionStart}
            onMouseLeave={onInteractionEnd}
            aria-label="Post options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleViewDetails}>
              View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyLink}>
              Copy link
            </DropdownMenuItem>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
              Share
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={handleShareToTwitter}>
              <Twitter className="mr-2 h-4 w-4" />
              <span>Share to Twitter</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShareViaDM} disabled={!nostrService.publicKey}>
              <Mail className="mr-2 h-4 w-4" />
              <span>Share via DM</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator />
          
          {!isOwnPost && (
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleFollow}>
                <UserPlus className="mr-2 h-4 w-4" />
                <span>Follow user</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleReport}>
                <Flag className="mr-2 h-4 w-4" />
                <span>Report</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          )}
          
          {isOwnPost && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDeleteClick} className="text-destructive focus:text-destructive">
                Delete post
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default NoteCardDropdownMenu;
