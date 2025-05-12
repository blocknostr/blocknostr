
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfileAvatarProps {
  pictureUrl?: string;
  displayName: string;
  isLoading?: boolean;
  size?: "default" | "large";
}

const ProfileAvatar = ({ 
  pictureUrl, 
  displayName, 
  isLoading = false,
  size = "large" 
}: ProfileAvatarProps) => {
  const [error, setError] = React.useState(false);
  
  // Reset error state when pictureUrl changes
  React.useEffect(() => {
    setError(false);
  }, [pictureUrl]);
  
  // Determine avatar fallback (first letter of display name)
  const avatarFallback = displayName ? displayName.charAt(0).toUpperCase() : '?';
  
  // Generate avatar size classes
  const sizeClasses = {
    default: "h-10 w-10 border-2",
    large: "h-24 w-24 md:h-32 md:w-32 border-4"
  };
  
  // Position classes for the large profile avatar that overlaps the banner
  const positionClasses = size === "large" ? "absolute -top-16 left-4 shadow-xl" : "";
  
  if (isLoading) {
    return (
      <Skeleton 
        className={`${sizeClasses[size]} ${positionClasses} rounded-full`} 
      />
    );
  }

  return (
    <Avatar 
      className={`${sizeClasses[size]} ${positionClasses} border-background`}
    >
      {!error && pictureUrl && (
        <AvatarImage 
          src={pictureUrl} 
          onError={() => setError(true)}
          loading="eager"
        />
      )}
      <AvatarFallback className="text-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
        {avatarFallback}
      </AvatarFallback>
    </Avatar>
  );
};

export default ProfileAvatar;
