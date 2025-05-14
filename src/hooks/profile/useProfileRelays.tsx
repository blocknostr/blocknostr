
import { useState, useEffect, useRef } from 'react';
import { nostrService, Relay } from '@/lib/nostr';
import { toast } from 'sonner';

interface UseProfileRelaysProps {
  hexPubkey: string | undefined;
  isCurrentUser: boolean;
}

export function useProfileRelays({ hexPubkey, isCurrentUser }: UseProfileRelaysProps) {
  const [relays, setRelays] = useState<Relay[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mountedRef = useRef(true);
  
  // Track if component is still mounted
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  useEffect(() => {
    if (!hexPubkey) return;
    
    // Reset state when pubkey changes
    setRelays([]);
    setHasError(false);
    setErrorMessage(null);
    setIsLoading(true);
    
    const fetchRelays = async () => {
      try {
        if (isCurrentUser) {
          // For current user, get relays from nostrService
          const relayStatus = nostrService.getRelayStatus();
          if (mountedRef.current) {
            setRelays(relayStatus);
            setIsLoading(false);
          }
        } else {
          // For other users, try to get their relays
          const userRelaysUrls = await nostrService.getRelaysForUser(hexPubkey);
          
          // Convert URLs to relay objects
          const userRelays: Relay[] = userRelaysUrls.map(url => ({
            url,
            status: 'connected', // We can't actually know their status
            read: true,
            write: true
          }));
          
          if (mountedRef.current) {
            setRelays(userRelays);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("Error fetching relays:", error);
        if (mountedRef.current) {
          setIsLoading(false);
          setHasError(true);
          setErrorMessage("Failed to load relays");
          
          // If we couldn't get relays, set some defaults
          setRelays([
            { url: "wss://relay.damus.io", status: 'connected', read: true, write: true },
            { url: "wss://nos.lol", status: 'connected', read: true, write: true },
            { url: "wss://relay.nostr.band", status: 'connected', read: true, write: true }
          ]);
        }
      }
    };
    
    fetchRelays();
  }, [hexPubkey, isCurrentUser]);
  
  return {
    relays,
    isLoading,
    hasError,
    errorMessage,
    refetch: () => {
      if (!hexPubkey) return;
      
      setIsLoading(true);
      setHasError(false);
      setErrorMessage(null);
      
      // This will trigger the useEffect above
      const event = new CustomEvent('refetchRelays', { detail: { pubkey: hexPubkey } });
      window.dispatchEvent(event);
    }
  };
}
