import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import ProfileAvatar from '@/components/profile/ProfileAvatar';

/**
 * NoteFormAvatar Component - Uses unified ProfileAvatar for consistency
 */
export function NoteFormAvatar() {
  const { publicKey } = useAuth();

  if (!publicKey) {
    return null;
  }

  return (
    <ProfileAvatar 
      pubkey={publicKey}
      size="lg"
      className="border-2 border-background shadow-lg"
      fallbackClassName="bg-primary text-primary-foreground"
      autoFetch={true}
    />
  );
}

