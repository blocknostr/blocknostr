
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ProfileAvatarProps {
  pictureUrl?: string;
  displayName: string;
}

const ProfileAvatar = ({ pictureUrl, displayName }: ProfileAvatarProps) => {
  const initial = displayName ? displayName.charAt(0).toUpperCase() : '?';
  
  return (
    <Avatar className="h-24 w-24 md:h-32 md:w-32 absolute -top-12 left-4 border-4 border-background">
      {pictureUrl ? (
        <AvatarImage src={pictureUrl} alt={displayName} />
      ) : null}
      <AvatarFallback className="text-2xl bg-primary/10">
        {initial}
      </AvatarFallback>
    </Avatar>
  );
};

export default ProfileAvatar;
