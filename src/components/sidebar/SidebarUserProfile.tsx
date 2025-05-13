
import React, { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { nostrService } from "@/lib/nostr";
import { Check, UserRound } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { UserProfileHoverCard } from "./UserProfileHoverCard";
import { useProfileVerification } from "@/hooks/useProfileVerification";

interface UserProfileProps {
  userProfile: {
    name?: string;
    display_name?: string;
    picture?: string;
    nip05?: string;
    about?: string;
  };
  isLoading: boolean;
  onRetry?: () => void;
}

const SidebarUserProfile = ({ userProfile, isLoading, onRetry }: UserProfileProps) => {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const isCollapsed = state === "collapsed";
  const currentPubkey = nostrService.publicKey;
  
  const { isVerified } = useProfileVerification(
    userProfile.nip05,
    currentPubkey
  );
  
  // Get user initials for avatar fallback
  const getUserInitials = useMemo(() => {
    if (userProfile.display_name || userProfile.name) {
      const name = (userProfile.display_name || userProfile.name || '').trim();
      if (name) {
        return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
      }
    }
    return 'U';
  }, [userProfile.display_name, userProfile.name]);

  const handleProfileClick = () => {
    if (currentPubkey) {
      try {
        const npub = nostrService.getNpubFromHex(currentPubkey);
        navigate(`/profile/${npub}`);
      } catch (error) {
        console.error("Error navigating to profile:", error);
      }
    }
  };
  
  // Profile content based on sidebar state
  const profileContent = (
    <div 
      className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-2'} py-2 rounded-md hover:bg-muted/50 transition-colors`}
      role="button"
      aria-label="View your profile"
      tabIndex={0}
      onClick={handleProfileClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleProfileClick();
        }
      }}
    >
      <Avatar className={isCollapsed ? "h-9 w-9" : undefined}>
        {isLoading ? (
          <AvatarFallback className="animate-pulse">{getUserInitials}</AvatarFallback>
        ) : (
          <>
            <AvatarImage 
              src={userProfile.picture} 
              alt={userProfile.display_name || userProfile.name || 'User'} 
            />
            <AvatarFallback>{getUserInitials}</AvatarFallback>
          </>
        )}
      </Avatar>
      
      {!isCollapsed && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="font-medium text-sm truncate max-w-[120px]">
              {userProfile.display_name || userProfile.name || 'User'}
            </span>
            {isVerified && userProfile.nip05 && (
              <span className="text-primary" title="Verified user">
                <Check className="h-3 w-3" />
              </span>
            )}
          </div>
          {userProfile.nip05 && (
            <span 
              className="text-xs text-muted-foreground truncate max-w-[140px]"
              title={userProfile.nip05}
            >
              {userProfile.nip05}
            </span>
          )}
        </div>
      )}
    </div>
  );

  // Show error state if no profile and not loading
  if (!isLoading && !userProfile.name && !userProfile.display_name) {
    return (
      <div className="flex items-center gap-3 px-2 py-2 rounded-md">
        <Avatar>
          <AvatarFallback><UserRound /></AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-medium text-sm">Profile not found</span>
          {onRetry && (
            <button 
              onClick={onRetry}
              className="text-xs text-primary hover:underline"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <UserProfileHoverCard 
      userProfile={userProfile} 
      pubkey={currentPubkey || ''}
      isLoading={isLoading}
      isVerified={isVerified}
    >
      {profileContent}
    </UserProfileHoverCard>
  );
};

export default SidebarUserProfile;
