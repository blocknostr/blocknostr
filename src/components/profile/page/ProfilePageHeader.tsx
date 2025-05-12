
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Edit, Wifi, WifiOff } from "lucide-react";

interface ProfilePageHeaderProps {
  isCurrentUser: boolean;
  connectedRelayCount: number;
  refreshing: boolean;
  handleRefresh: () => void;
  openEditProfile: () => void;
}

const ProfilePageHeader: React.FC<ProfilePageHeaderProps> = ({
  isCurrentUser,
  connectedRelayCount,
  refreshing,
  handleRefresh,
  openEditProfile,
}) => {
  return (
    <header className="sticky top-0 bg-background/80 backdrop-blur-sm z-10">
      <div className="flex items-center justify-between h-14 px-4">
        <h1 className="font-semibold">Profile</h1>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {connectedRelayCount > 0 ? (
              <Wifi className="h-3 w-3 text-green-500" />
            ) : (
              <WifiOff className="h-3 w-3 text-red-500" />
            )}
            <span>{connectedRelayCount} relays</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          {isCurrentUser && (
            <Button
              variant="outline"
              size="sm"
              onClick={openEditProfile}
              className="flex items-center"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default ProfilePageHeader;
