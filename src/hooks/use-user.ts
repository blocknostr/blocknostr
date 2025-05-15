
import { useState, useEffect } from 'react';
import { nostrService } from '@/lib/nostr';

type User = {
  pubkey: string;
  profile?: any;
};

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
      setLoading(true);
      
      try {
        const pubkey = nostrService.publicKey;
        
        if (pubkey) {
          // User is logged in
          const profile = await nostrService.getUserProfile?.(pubkey);
          setUser({ pubkey, profile });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUserStatus();
  }, []);

  return { user, loading };
}
