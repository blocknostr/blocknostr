
import React from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { nostrService } from "@/lib/nostr";
import { Button } from "@/components/ui/button";
import { CalendarIcon, CheckCircle2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

  // Format account creation date
  const formatCreationDate = () => {
    if (!userProfile.created_at) return "Unknown";
    return formatDistanceToNow(new Date(userProfile.created_at * 1000), { addSuffix: true });
  };

  // Check if NIP-05 is verified
  const isNip05Verified = !!userProfile.nip05;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
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
      </HoverCardTrigger>
      
      <HoverCardContent className="w-80 p-4">
        <div className="flex flex-col space-y-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={userProfile.picture} />
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <h4 className="text-sm font-semibold">
                {userProfile.display_name || userProfile.name || 'User'}
              </h4>
              {userProfile.nip05 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {userProfile.nip05}
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                </p>
              )}
            </div>
          </div>

          {userProfile.about && (
            <p className="text-sm text-muted-foreground line-clamp-3">{userProfile.about}</p>
          )}

          <div className="flex items-center pt-2">
            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Joined {formatCreationDate()}
            </span>
          </div>

          <Button asChild size="sm" className="w-full mt-2">
            <Link to={getProfileUrl()}>View Profile</Link>
          </Button>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default SidebarUserProfile;
