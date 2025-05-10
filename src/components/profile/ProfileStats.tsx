
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { nostrService, Relay } from "@/lib/nostr";
import FollowButton from "../FollowButton";
import ProfileRelaysDialog from "./ProfileRelaysDialog";
import { Link } from "react-router-dom";

interface ProfileStatsProps {
  followers: string[];
  following: string[];
  postsCount: number;
  currentUserPubkey: string | null;
  isCurrentUser: boolean;
  relays: Relay[];
  onRelaysChange?: (relays: Relay[]) => void;
  userNpub?: string;
}

const ProfileStats = ({ 
  followers, 
  following, 
  postsCount, 
  currentUserPubkey,
  isCurrentUser,
  relays,
  onRelaysChange,
  userNpub
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
        />
        <StatItem 
          label="Following" 
          value={following.length.toLocaleString()}
          onClick={() => setShowFollowing(true)} 
        />
        <StatItem 
          label="Followers" 
          value={followers.length.toLocaleString()} 
          onClick={() => setShowFollowers(true)}
        />
        <StatItem 
          label="Relays" 
          value={relays.length.toLocaleString()} 
          onClick={() => setShowRelays(true)}
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
}

const StatItem = ({ label, value, icon, onClick }: StatItemProps) => {
  return (
    <div 
      className={`flex flex-col items-center justify-center py-4 px-2 hover:bg-muted/50 transition-colors ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="font-semibold">{value}</span>
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
  const [profileData, setProfileData] = useState<any>(null);
  const npub = nostrService.getNpubFromHex(pubkey);
  const shortNpub = `${npub.substring(0, 8)}...${npub.substring(npub.length - 5)}`;
  
  // Load profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      // This is a placeholder - in a real app, you would fetch this data from the network
      const subId = nostrService.subscribe(
        [{ kinds: [0], authors: [pubkey], limit: 1 }],
        (event) => {
          try {
            const metadata = JSON.parse(event.content);
            setProfileData(metadata);
          } catch (e) {
            console.error('Failed to parse profile metadata:', e);
          }
        }
      );
      
      // Clean up subscription
      setTimeout(() => {
        nostrService.unsubscribe(subId);
      }, 5000);
    };
    
    fetchProfileData();
  }, [pubkey]);
  
  const name = profileData?.display_name || profileData?.name || shortNpub;
  const username = profileData?.name || shortNpub;
  const avatarFallback = name.charAt(0).toUpperCase();
  
  return (
    <div className="flex items-center justify-between">
      <Link to={`/profile/${npub}`} className="flex items-center gap-3 flex-1">
        <Avatar className="h-10 w-10">
          <AvatarImage src={profileData?.picture} />
          <AvatarFallback className="bg-primary/10 text-primary">{avatarFallback}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-muted-foreground">@{username}</div>
        </div>
      </Link>
      
      {currentUserPubkey && currentUserPubkey !== pubkey && (
        <FollowButton pubkey={pubkey} />
      )}
    </div>
  );
};

export default ProfileStats;
