
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { nostrService } from "@/lib/nostr";

interface UserProfileProps {
  userProfile: {
    name?: string;
    display_name?: string;
    picture?: string;
    nip05?: string;
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

  return (
    <div className="flex items-center gap-3 px-2 py-2 rounded-md">
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
          <span className="text-xs text-muted-foreground truncate max-w-[140px]">{userProfile.nip05}</span>
        )}
      </div>
    </div>
  );
};

export default SidebarUserProfile;
