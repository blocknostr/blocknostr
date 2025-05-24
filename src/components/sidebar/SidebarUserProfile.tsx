
import React from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { nostrService } from "@/lib/nostr";
import { CheckCircle2 } from "lucide-react";

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

  // Generate profile URL
  const getProfileUrl = () => {
    if (!nostrService.publicKey) return "/login";
    return `/profile/${nostrService.getNpubFromHex(nostrService.publicKey)}`;
  };

  return (
    <Link 
      to={getProfileUrl()} 
      className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="View your profile"
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
          <span className="text-xs text-muted-foreground truncate max-w-[140px] flex items-center gap-1">
            {userProfile.nip05}
            <CheckCircle2 className="h-3 w-3 text-primary" />
          </span>
        )}
      </div>
    </Link>
  );
};

export default SidebarUserProfile;
