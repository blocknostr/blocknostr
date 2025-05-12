
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Edit, Share2 } from "lucide-react";
import FollowButton from "@/components/FollowButton";

interface ProfileActionsProps {
  isCurrentUser: boolean;
  onEditProfile: () => void;
  pubkeyHex: string;
}

const ProfileActions = ({ isCurrentUser, onEditProfile, pubkeyHex }: ProfileActionsProps) => {
  const [isCopied, setIsCopied] = useState(false);
  
  const handleCopyProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  return (
    <div className="flex gap-2 mt-2 md:mt-0">
      {isCurrentUser ? (
        <Button onClick={onEditProfile} size="sm" className="flex items-center gap-1">
          <Edit className="h-4 w-4" />
          <span className="hidden sm:inline">Edit Profile</span>
        </Button>
      ) : (
        <FollowButton pubkey={pubkeyHex} />
      )}
      
      <Button variant="outline" size="sm" onClick={handleCopyProfile}>
        <Share2 className="h-4 w-4 mr-0 sm:mr-1" />
        <span className="hidden sm:inline">{isCopied ? "Copied!" : "Share"}</span>
      </Button>
    </div>
  );
};

export default ProfileActions;
