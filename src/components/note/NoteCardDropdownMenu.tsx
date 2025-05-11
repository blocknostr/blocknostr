
import { MoreHorizontal } from 'lucide-react';
import { Button } from "../ui/button";
import { nostrService } from '@/lib/nostr';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
          console.log('Link copied to clipboard');
        })
        .catch(err => {
          console.error('Failed to copy link:', err);
        });
    }
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
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleViewDetails}>
            View details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyLink}>
            Copy link
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {pubkey === nostrService.publicKey && (
            <DropdownMenuItem onClick={onDeleteClick} className="text-destructive focus:text-destructive">
              Delete post
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default NoteCardDropdownMenu;
