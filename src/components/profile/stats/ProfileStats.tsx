
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Relay } from "@/lib/nostr";
import ProfileRelaysDialog from "../ProfileRelaysDialog";
import StatItem from "./StatItem";
import FollowersDialog from "./FollowersDialog";
import FollowingDialog from "./FollowingDialog";

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
      
      {/* Dialogs for followers and following */}
      <FollowingDialog 
        open={showFollowing} 
        onOpenChange={setShowFollowing}
        following={following}
        currentUserPubkey={currentUserPubkey}
      />
      
      <FollowersDialog
        open={showFollowers}
        onOpenChange={setShowFollowers}
        followers={followers}
        currentUserPubkey={currentUserPubkey}
      />

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

export default ProfileStats;
