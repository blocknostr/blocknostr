
import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileAvatarProps {
  avatarUrl?: string | null;
  displayName?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function ProfileAvatar({ avatarUrl, displayName, size = "md" }: ProfileAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
    xl: "h-24 w-24"
  };
  
  const fallbackSize = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  };
  
  const initials = displayName ? displayName.charAt(0).toUpperCase() : "U";

  return (
    <Avatar className={`${sizeClasses[size]} border-2 border-background`}>
      <AvatarImage src={avatarUrl || ""} alt={displayName || "User"} />
      <AvatarFallback>
        {avatarUrl ? (
          initials
        ) : (
          <User className={fallbackSize[size]} />
        )}
      </AvatarFallback>
    </Avatar>
  );
}
