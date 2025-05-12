
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileAvatarProps {
  pictureUrl?: string;
  displayName: string;
  size?: "sm" | "md" | "lg" | "xl";
  avatarUrl?: string; // For backward compatibility
}

export const ProfileAvatar = ({ pictureUrl, displayName, size = "md", avatarUrl }: ProfileAvatarProps) => {
  const imageUrl = pictureUrl || avatarUrl;
  const avatarFallback = displayName.charAt(0).toUpperCase();
  
  // Size classes mapping
  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-16 w-16",
    lg: "h-24 w-24 md:h-32 md:w-32",
    xl: "h-32 w-32 md:h-40 md:w-40"
  };
  
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  
  return (
    <Avatar className={`${sizeClass} border-4 border-background shadow-xl`}>
      <AvatarImage src={imageUrl} />
      <AvatarFallback className="text-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
        {avatarFallback}
      </AvatarFallback>
    </Avatar>
  );
};

export default ProfileAvatar;
