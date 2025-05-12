
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileAvatarProps {
  pictureUrl?: string;
  displayName: string;
}

const ProfileAvatar = ({ pictureUrl, displayName }: ProfileAvatarProps) => {
  const avatarFallback = displayName.charAt(0).toUpperCase();

  return (
    <Avatar className="h-24 w-24 md:h-32 md:w-32 absolute -top-16 left-4 border-4 border-background shadow-xl">
      <AvatarImage src={pictureUrl} />
      <AvatarFallback className="text-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
        {avatarFallback}
      </AvatarFallback>
    </Avatar>
  );
};

export default ProfileAvatar;
