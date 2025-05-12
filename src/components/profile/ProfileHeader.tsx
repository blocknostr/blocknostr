
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, CheckCircle2, LinkIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { adaptedNostrService } from "@/lib/nostr/nostr-adapter";
import { toast } from "sonner";

interface ProfileHeaderProps {
  profileData: any;
  npub: string;
  isCurrentUser: boolean;
  isLoading?: boolean;
}

const ProfileHeader = ({ 
  profileData, 
  npub, 
  isCurrentUser,
  isLoading = false 
}: ProfileHeaderProps) => {
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [followLoading, setFollowLoading] = React.useState(false);
  
  // Check if we're following this user
  React.useEffect(() => {
    if (!isCurrentUser && profileData?.pubkey) {
      adaptedNostrService.isFollowing(profileData.pubkey)
        .then(following => {
          setIsFollowing(following);
        })
        .catch(err => {
          console.error("Error checking follow status:", err);
        });
    }
  }, [isCurrentUser, profileData?.pubkey]);
  
  // Get creation date from profile data
  const createdAt = profileData?._event?.created_at || profileData?.created_at;
  const displayDate = createdAt 
    ? formatDistanceToNow(new Date(createdAt * 1000), { addSuffix: true })
    : null;
  
  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!profileData?.pubkey) return;
    
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await adaptedNostrService.unfollowUser(profileData.pubkey);
        setIsFollowing(false);
        toast.success('Unfollowed user');
      } else {
        await adaptedNostrService.followUser(profileData.pubkey);
        setIsFollowing(true);
        toast.success('Followed user');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };
  
  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (profileData?.display_name || profileData?.name) {
      const name = (profileData.display_name || profileData.name || '').trim();
      if (name) {
        return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
      }
    }
    return 'U';
  };
  
  return (
    <div className="mb-6">
      <div className="relative">
        {/* Profile Banner */}
        <div className="h-32 md:h-48 rounded-lg overflow-hidden bg-gradient-to-r from-blue-400 to-purple-500">
          {profileData?.banner ? (
            <img
              src={profileData.banner}
              alt="Profile banner"
              className="w-full h-full object-cover"
            />
          ) : null}
        </div>
        
        {/* Avatar */}
        <div className="absolute -bottom-16 left-4">
          {isLoading ? (
            <Skeleton className="h-[88px] w-[88px] rounded-full" />
          ) : (
            <Avatar className="h-[88px] w-[88px] border-4 border-background">
              <AvatarImage src={profileData?.picture} alt={profileData?.display_name || profileData?.name || 'User'} />
              <AvatarFallback className="text-2xl">{getUserInitials()}</AvatarFallback>
            </Avatar>
          )}
        </div>
        
        {/* Follow Button */}
        {!isCurrentUser && (
          <div className="absolute -bottom-12 right-4">
            <Button 
              onClick={handleFollowToggle}
              disabled={followLoading}
              variant={isFollowing ? "outline" : "default"}
              className={`flex items-center gap-1 ${isFollowing ? "bg-background text-foreground" : ""}`}
            >
              {isFollowing ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Following
                </>
              ) : (
                "Follow"
              )}
            </Button>
          </div>
        )}
      </div>
      
      {/* Profile Info */}
      <div className="pt-20 pb-2">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-4 w-64" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold">
                {profileData?.display_name || profileData?.name || 'User'}
              </h1>
              {profileData?.nip05 && (
                <span className="flex items-center text-sm text-blue-500">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  {profileData.nip05}
                </span>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              @{npub.substring(0, 8)}...{npub.substring(npub.length - 4)}
            </p>
            
            {profileData?.about && (
              <p className="text-sm mb-3 whitespace-pre-wrap">
                {profileData.about}
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              {profileData?.website && (
                <a 
                  href={profileData.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-foreground"
                >
                  <LinkIcon className="h-3.5 w-3.5 mr-1" />
                  {profileData.website.replace(/https?:\/\/(www\.)?/i, '')}
                </a>
              )}
              
              {displayDate && (
                <span className="flex items-center">
                  <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                  Joined {displayDate}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
