
import { useState, useEffect } from 'react';
import { nostrService } from '@/lib/nostr';

export function useProfileRelays(npub: string) {
  const [relays, setRelays] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRelays = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Convert npub to hex pubkey
        let hexPubkey: string;
        
        try {
          hexPubkey = nostrService.getHexFromNpub(npub);
          if (!hexPubkey) throw new Error("Invalid npub");
        } catch (e) {
          console.error("Error converting npub to hex:", e);
          setError("Invalid npub format");
          setLoading(false);
          return;
        }
        
        // Get relays for user
        const userRelays = await nostrService.getRelaysForUser(hexPubkey);
        
        if (userRelays && Object.keys(userRelays).length > 0) {
          // Extract the relay URLs only
          const relayUrls = Object.keys(userRelays);
          setRelays(relayUrls);
        } else {
          // No custom relays found
          setRelays([]);
        }
      } catch (e) {
        console.error("Error fetching user relays:", e);
        setError("Failed to load user's relays");
        setRelays([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (npub) {
      loadRelays();
    } else {
      setRelays([]);
      setLoading(false);
    }
  }, [npub]);
  
  return { relays, loading, error };
}
