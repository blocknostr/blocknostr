
import { useState, useEffect } from 'react';
import { nostrService, Relay } from '@/lib/nostr';

interface UseProfileRelaysProps {
  isCurrentUser: boolean;
}

export function useProfileRelays({ isCurrentUser }: UseProfileRelaysProps) {
  const [relays, setRelays] = useState<Relay[]>([]);
  
  useEffect(() => {
    // Load relay status if this is the current user
    if (isCurrentUser) {
      const relayStatus = nostrService.getRelayStatus();
      setRelays(relayStatus);
    }
  }, [isCurrentUser]);

  return { relays, setRelays };
}
