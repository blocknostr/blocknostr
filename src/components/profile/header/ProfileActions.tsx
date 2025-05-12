
import React from "react";
import { Button } from "@/components/ui/button";
import { Edit, MessageSquare, UserCog } from "lucide-react";
import FollowButton from "@/components/FollowButton";
import { Link } from "react-router-dom";

interface ProfileActionsProps {
  isCurrentUser: boolean;
  onEditProfile: () => void;
  pubkeyHex: string;
}

const ProfileActions = ({ isCurrentUser, onEditProfile, pubkeyHex }: ProfileActionsProps) => {
  return (
    <div className="space-x-2 mt-4 md:mt-0">
      {isCurrentUser ? (
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEditProfile}>
            <Edit className="h-4 w-4 mr-2" />
            Quick Edit
          </Button>
          <Link to="/settings/profile">
            <Button variant="default">
              <UserCog className="h-4 w-4 mr-2" />
              Full Edit
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex gap-2">
          <FollowButton pubkey={pubkeyHex} />
          <Link to={`/messages/${pubkeyHex}`}>
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Message
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default ProfileActions;
