import { useState, useEffect } from 'react';
import { MoreHorizontal, Twitter, Flag, UserPlus, Mail, BellOff, UserX } from 'lucide-react';
import { Button } from "../ui/button";
import { nostrService } from '@/lib/nostr';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/lib/toast";
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
  profileData?: Record<string, any>;
  onDeleteClick: () => void;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

const NoteCardDropdownMenu = ({ 
  eventId, 
  pubkey, 
  profileData,
  onDeleteClick,
  onInteractionStart,
  onInteractionEnd
}: NoteCardDropdownMenuProps) => {
  const navigate = useNavigate();
  const isOwnPost = pubkey === nostrService.publicKey;
  const [isUserMuted, setIsUserMuted] = useState(false);
  const [isUserBlocked, setIsUserBlocked] = useState(false);
  const [isLoadingMuteStatus, setIsLoadingMuteStatus] = useState(true);
  const [isLoadingBlockStatus, setIsLoadingBlockStatus] = useState(true);
  
  // Get name from profile data or use shortNpub as fallback
  const npub = nostrService.getNpubFromHex(pubkey);
  const shortNpub = `${npub.substring(0, 9)}...${npub.substring(npub.length - 5)}`;
  const name = profileData?.name || shortNpub;
  const displayName = profileData?.display_name || name;
  
  // Fetch mute and block status when component mounts
  useEffect(() => {
    if (!pubkey || !nostrService.publicKey) {
      setIsLoadingMuteStatus(false);
      setIsLoadingBlockStatus(false);
      return;
    }
    
    // Check if user is muted
    const checkMuteStatus = async () => {
      try {
        const muted = await nostrService.isUserMuted(pubkey);
        setIsUserMuted(muted);
      } catch (error) {
        console.error("Error checking mute status:", error);
      } finally {
        setIsLoadingMuteStatus(false);
      }
    };
    
    // Check if user is blocked
    const checkBlockStatus = async () => {
      try {
        const blocked = await nostrService.isUserBlocked(pubkey);
        setIsUserBlocked(blocked);
      } catch (error) {
        console.error("Error checking block status:", error);
      } finally {
        setIsLoadingBlockStatus(false);
      }
    };
    
    checkMuteStatus();
    checkBlockStatus();
  }, [pubkey]);
  
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

  const handleNotInterested = () => {
    toast.success("We'll show fewer posts like this");
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
    // Functionality removed as part of BlockMail cleanup
    toast.info('Direct messaging feature has been removed');
  };

  const handleMuteAuthor = async () => {
    if (!nostrService.publicKey) {
      toast.error("You must be logged in to mute users");
      return;
    }
    
    try {
      if (isUserMuted) {
        // Unmute
        const result = await nostrService.unmuteUser(pubkey);
        if (result) {
          setIsUserMuted(false);
          toast.success(`Unmuted ${displayName}`);
        }
      } else {
        // Mute
        const result = await nostrService.muteUser(pubkey);
        if (result) {
          setIsUserMuted(true);
          toast.success(`Muted ${displayName}`);
        }
      }
    } catch (error) {
      console.error("Error toggling mute status:", error);
      toast.error(`Failed to ${isUserMuted ? 'unmute' : 'mute'} user`);
    }
  };

  const handleBlockAuthor = async () => {
    if (!nostrService.publicKey) {
      toast.error("You must be logged in to block users");
      return;
    }
    
    try {
      if (isUserBlocked) {
        // Unblock
        const result = await nostrService.unblockUser(pubkey);
        if (result) {
          setIsUserBlocked(false);
          toast.success(`Unblocked ${displayName}`);
        }
      } else {
        // Block
        const result = await nostrService.blockUser(pubkey);
        if (result) {
          setIsUserBlocked(true);
          toast.success(`Blocked ${displayName}`);
        }
      }
    } catch (error) {
      console.error("Error toggling block status:", error);
      toast.error(`Failed to ${isUserBlocked ? 'unblock' : 'block'} user`);
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
          <DropdownMenuItem onClick={handleNotInterested}>
            Not interested in this post
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
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
              {isLoadingMuteStatus ? (
                <DropdownMenuItem disabled>
                  <BellOff className="mr-2 h-4 w-4" />
                  <span>Loading mute status...</span>
                </DropdownMenuItem>
              ) : !isUserMuted ? (
                <DropdownMenuItem onClick={handleMuteAuthor}>
                  <BellOff className="mr-2 h-4 w-4" />
                  <span>Mute @{name}</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleMuteAuthor}>
                  <BellOff className="mr-2 h-4 w-4" />
                  <span>Unmute @{name}</span>
                </DropdownMenuItem>
              )}
              {isLoadingBlockStatus ? (
                <DropdownMenuItem disabled>
                  <UserX className="mr-2 h-4 w-4" />
                  <span>Loading block status...</span>
                </DropdownMenuItem>
              ) : !isUserBlocked ? (
                <DropdownMenuItem onClick={handleBlockAuthor} className="text-destructive focus:text-destructive">
                  <UserX className="mr-2 h-4 w-4" />
                  <span>Block @{name}</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleBlockAuthor}>
                  <UserX className="mr-2 h-4 w-4" />
                  <span>Unblock @{name}</span>
                </DropdownMenuItem>
              )}
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

