
import React from "react";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import FollowButton from "@/components/FollowButton";

interface ProfileActionsProps {
  isCurrentUser: boolean;
  onEditProfile: () => void;
  pubkeyHex: string;
}

const ProfileActions = ({ isCurrentUser, onEditProfile, pubkeyHex }: ProfileActionsProps) => {
  return (
    <div className="space-x-2 mt-4 md:mt-0">
      {isCurrentUser ? (
        <Button variant="outline" onClick={onEditProfile}>
          <Edit className="h-4 w-4 mr-2" />
          Edit profile
        </Button>
      ) : (
        <FollowButton pubkey={pubkeyHex} />
      )}
    </div>
  );
};

export default ProfileActions;
