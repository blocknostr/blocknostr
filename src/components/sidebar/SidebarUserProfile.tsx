
import React from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { nostrService } from "@/lib/nostr";
import { Settings, Crown, UserRound } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserProfileProps {
  userProfile: {
    name?: string;
    display_name?: string;
    picture?: string;
    nip05?: string;
    about?: string;
    created_at?: number;
  };
  isLoading: boolean;
}

const SidebarUserProfile = ({ userProfile, isLoading }: UserProfileProps) => {
  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (userProfile.display_name || userProfile.name) {
      const name = (userProfile.display_name || userProfile.name || '').trim();
      if (name) {
        return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
      }
    }
    return 'U';
  };

  // Get the user's public key from localStorage
  const pubkey = localStorage.getItem('nostr:pubkey');
  const profileUrl = pubkey ? `/profile/${pubkey}` : '/login';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-full text-left"
          aria-label="User menu"
        >
          <Avatar>
            {isLoading ? (
              <AvatarFallback className="animate-pulse">{getUserInitials()}</AvatarFallback>
            ) : (
              <>
                <AvatarImage src={userProfile.picture} alt={userProfile.display_name || userProfile.name || 'User'} />
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </>
            )}
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm truncate max-w-[140px]">
              {userProfile.display_name || userProfile.name || 'User'}
            </span>
            {userProfile.nip05 && (
              <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                {userProfile.nip05}
              </span>
            )}
          </div>
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56" align="start" sideOffset={8}>
        <DropdownMenuItem asChild>
          <Link to={profileUrl} className="flex items-center cursor-pointer">
            <UserRound className="mr-2 h-4 w-4" />
            <span>View Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings" className="flex items-center cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/premium" className="flex items-center cursor-pointer">
            <Crown className="mr-2 h-4 w-4" />
            <span>Premium</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SidebarUserProfile;
