
import React from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface NoteFormAvatarProps {
  pubkey: string | null;
}

const NoteFormAvatar: React.FC<NoteFormAvatarProps> = ({ pubkey }) => {
  if (!pubkey) return null;
  
  // Get first character of pubkey for avatar fallback
  const avatarFallback = pubkey.substring(0, 2).toUpperCase();
  
  return (
    <Avatar className={cn(
      "h-10 w-10 ring-2 ring-background/50 ring-offset-1 transition-all duration-300",
      "hover:ring-primary/20 hover:scale-105"
    )}>
      <AvatarFallback className="font-medium bg-primary/5 text-primary/80">
        {avatarFallback}
      </AvatarFallback>
    </Avatar>
  );
};

export default NoteFormAvatar;
