
import React from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NoteFormAvatarProps {
  pubkey: string | null;
}

const NoteFormAvatar: React.FC<NoteFormAvatarProps> = ({ pubkey }) => {
  if (!pubkey) return null;
  
  // Get first character of pubkey for avatar fallback
  const avatarFallback = pubkey.substring(0, 2).toUpperCase();
  
  return (
    <Avatar className="h-10 w-10 mt-1">
      <AvatarFallback>{avatarFallback}</AvatarFallback>
    </Avatar>
  );
};

export default NoteFormAvatar;
