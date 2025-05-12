
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { nostrService, Relay } from "@/lib/nostr";
import FollowButton from "../FollowButton";
import ProfileRelaysDialog from "./ProfileRelaysDialog";
import { Link } from "react-router-dom";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  onRefresh?: () => void;
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
  isLoading = false,
  onRefresh
}: ProfileStatsProps) => {
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showRelays, setShowRelays] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = () => {
    if (onRefresh) {
      setIsRefreshing(true);
      onRefresh();
      
      // Reset refreshing state after a timeout
      setTimeout(() => setIsRefreshing(false), 3000);
    }
  };
  
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
          onClick={() => !isLoading && following.length > 0 && setShowFollowing(true)} 
          isLoading={isLoading}
        />
        <StatItem 
          label="Followers" 
          value={followers.length.toLocaleString()} 
          onClick={() => !isLoading && followers.length > 0 && setShowFollowers(true)}
          isLoading={isLoading}
        />
        <StatItem 
          label="Relays" 
          value={relays.length.toLocaleString()} 
          onClick={() => !isLoading && setShowRelays(true)}
          isLoading={isLoading}
          actionButton={
            onRefresh && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5 absolute top-1 right-1 text-muted-foreground hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRefresh();
                }}
                disabled={isRefreshing || isLoading}
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            )
          }
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
  actionButton?: React.ReactNode;
}

const StatItem = ({ label, value, icon, onClick, isLoading = false, actionButton }: StatItemProps) => {
  return (
    <div 
      className={`flex flex-col items-center justify-center py-4 px-2 hover:bg-muted/50 transition-colors relative ${onClick && !isLoading ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-1.5">
        {icon}
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <span className="font-semibold">{value}</span>
        )}
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
      {actionButton}
    </div>
  );
};

interface UserListItemProps {
  pubkey: string;
  currentUserPubkey: string | null;
}

const UserListItem = ({ pubkey, currentUserPubkey }: UserListItemProps) => {
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const npub = nostrService.getNpubFromHex(pubkey);
  const shortNpub = `${npub.substring(0, 8)}...${npub.substring(npub.length - 5)}`;
  
  // Load profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        const profile = await nostrService.getUserProfile(pubkey);
        if (profile) {
          setProfileData(profile);
        }
      } catch (e) {
        console.error('Failed to fetch profile metadata:', e);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
  }, [pubkey]);
  
  const name = profileData?.display_name || profileData?.name || shortNpub;
  const username = profileData?.name || shortNpub;
  const avatarFallback = name.charAt(0).toUpperCase();
  
  return (
    <div className="flex items-center justify-between">
      <Link to={`/profile/${npub}`} className="flex items-center gap-3 flex-1 hover:bg-muted/50 p-2 rounded-md">
        <Avatar className="h-10 w-10">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center bg-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <>
              <AvatarImage src={profileData?.picture} />
              <AvatarFallback className="bg-primary/10 text-primary">{avatarFallback}</AvatarFallback>
            </>
          )}
        </Avatar>
        <div>
          <div className="font-medium">{isLoading ? "Loading..." : name}</div>
          <div className="text-sm text-muted-foreground">@{isLoading ? shortNpub : username}</div>
        </div>
      </Link>
      
      {currentUserPubkey && currentUserPubkey !== pubkey && (
        <FollowButton pubkey={pubkey} />
      )}
    </div>
  );
};

export default ProfileStats;
