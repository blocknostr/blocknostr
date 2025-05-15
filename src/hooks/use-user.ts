
import { useState, useEffect } from 'react';
import { nostrService } from '@/lib/nostr';

export function useUser() {
  const [user, setUser] = useState<{ pubkey: string } | null>(null);

  useEffect(() => {
    // Check if user is logged in with nostrService
    if (nostrService.publicKey) {
      setUser({ pubkey: nostrService.publicKey });
    }

    // Listen for login/logout events
    const handleLogin = () => {
      if (nostrService.publicKey) {
        setUser({ pubkey: nostrService.publicKey });
      }
    };

    const handleLogout = () => {
      setUser(null);
    };

    // Set up event listeners
    window.addEventListener('nostr:login', handleLogin);
    window.addEventListener('nostr:logout', handleLogout);

    return () => {
      window.removeEventListener('nostr:login', handleLogin);
      window.removeEventListener('nostr:logout', handleLogout);
    };
  }, []);

  return { user, isLoggedIn: !!user };
}
