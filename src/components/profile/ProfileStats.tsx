import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { nostrService, Relay } from "@/lib/nostr";
import FollowButton from "../FollowButton";
import ProfileRelaysDialog from "./ProfileRelaysDialog";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useInView } from "@/components/shared/useInView";
import { ProfileUtils } from "@/lib/nostr/utils/profileUtils";

interface ProfileStatsProps {
  followers: string[];
  following: string[];
  postsCount: number;
  currentUserPubkey: string | null;
  isCurrentUser: boolean;
  relays: Relay[];
  onRelaysChange?: (relays: Relay[]) => void;
  userNpub?: string;
  isLoading?: boolean;
}

const ProfileStats = ({ 
  followers, 
  following, 
  postsCount, 
  currentUserPubkey,
  isCurrentUser,
  relays,
  onRelaysChange,
  userNpub,
  isLoading = false
}: ProfileStatsProps) => {
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showRelays, setShowRelays] = useState(false);
  
  return (
    <Card className="mb-6 overflow-hidden">
      <div className="grid grid-cols-4 divide-x">
        <StatItem 
          label="Posts" 
          value={postsCount.toLocaleString()}
          isLoading={isLoading} 
        />
        <StatItem 
          label="Following" 
          value={following.length.toLocaleString()}
          onClick={() => following.length > 0 && setShowFollowing(true)}
          isLoading={isLoading}
        />
        <StatItem 
          label="Followers" 
          value={followers.length.toLocaleString()} 
          onClick={() => followers.length > 0 && setShowFollowers(true)}
          isLoading={isLoading}
        />
        <StatItem 
          label="Relays" 
          value={relays.length.toLocaleString()} 
          onClick={() => setShowRelays(true)}
          isLoading={isLoading}
        />
      </div>
      
      {/* Following Dialog */}
      <Dialog open={showFollowing} onOpenChange={setShowFollowing}>
        <DialogContent className="sm:max-w-[420px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Following</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {following.length === 0 ? (
              <div className="text-center text-muted-foreground">Not following anyone yet</div>
            ) : (
              <div className="space-y-4">
                {following.map((pubkey) => (
                  <UserListItem 
                    key={pubkey} 
                    pubkey={pubkey} 
                    currentUserPubkey={currentUserPubkey}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Followers Dialog */}
      <Dialog open={showFollowers} onOpenChange={setShowFollowers}>
        <DialogContent className="sm:max-w-[420px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Followers</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {followers.length === 0 ? (
              <div className="text-center text-muted-foreground">No followers yet</div>
            ) : (
              <div className="space-y-4">
                {followers.map((pubkey) => (
                  <UserListItem 
                    key={pubkey} 
                    pubkey={pubkey}
                    currentUserPubkey={currentUserPubkey}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Relays Dialog */}
      <ProfileRelaysDialog
        open={showRelays}
        onOpenChange={setShowRelays}
        relays={relays}
        onRelaysChange={onRelaysChange}
        isCurrentUser={isCurrentUser}
        userNpub={userNpub}
      />
    </Card>
  );
};

interface StatItemProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  isLoading?: boolean;
}

const StatItem = ({ label, value, icon, onClick, isLoading }: StatItemProps) => {
  return (
    <div 
      className={`flex flex-col items-center justify-center py-4 px-2 hover:bg-muted/50 transition-colors ${onClick && !isLoading ? 'cursor-pointer' : ''}`}
      onClick={!isLoading ? onClick : undefined}
    >
      <div className="flex items-center gap-1.5">
        {icon}
        {isLoading ? (
          <Skeleton className="h-6 w-12" />
        ) : (
          <span className="font-semibold">{value}</span>
        )}
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
};

interface UserListItemProps {
  pubkey: string;
  currentUserPubkey: string | null;
}

const UserListItem = ({ pubkey, currentUserPubkey }: UserListItemProps) => {
  const { ref, inView } = useInView({
    triggerOnce: true, 
    threshold: 0.1
  });
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const npub = nostrService.getNpubFromHex(pubkey);
  const shortNpub = `${npub.substring(0, 8)}...${npub.substring(npub.length - 5)}`;
  
  // Load profile data when in view
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!inView) return;
      
      try {
        setLoading(true);
        const profile = await ProfileUtils.fetchProfile(pubkey);
        if (profile) {
          setProfileData(profile);
        }
        setLoading(false);
      } catch (e) {
        console.error('Failed to fetch profile metadata:', e);
        setLoading(false);
      }
    };
    
    if (inView) {
      fetchProfileData();
    }
  }, [pubkey, inView]);
  
  const name = profileData?.display_name || profileData?.name || shortNpub;
  const username = profileData?.name || shortNpub;
  const avatarFallback = name.charAt(0).toUpperCase();
  
  return (
    <div ref={ref} className="flex items-center justify-between">
      <Link to={`/profile/${npub}`} className="flex items-center gap-3 flex-1 hover:bg-muted/50 p-2 rounded-md">
        {loading ? (
          <Skeleton className="h-10 w-10 rounded-full" />
        ) : (
          <Avatar className="h-10 w-10">
            <AvatarImage src={profileData?.picture} />
            <AvatarFallback className="bg-primary/10 text-primary">{avatarFallback}</AvatarFallback>
          </Avatar>
        )}
        <div>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          ) : (
            <>
              <div className="font-medium">{name}</div>
              <div className="text-sm text-muted-foreground">@{username}</div>
            </>
          )}
        </div>
      </Link>
      
      {currentUserPubkey && currentUserPubkey !== pubkey && (
        <FollowButton pubkey={pubkey} />
      )}
    </div>
  );
};

export default ProfileStats;
