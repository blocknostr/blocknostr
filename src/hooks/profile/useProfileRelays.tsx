import { useState, useEffect, useCallback } from 'react';
import { nostrService, adaptedNostrService, Relay } from '@/lib/nostr';
import { toast } from 'sonner';

export function useProfileRelays(pubkey: string | null, isCurrentUser: boolean = false) {
  const [relays, setRelays] = useState<Relay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load user's relays
  useEffect(() => {
    const fetchRelays = async () => {
      if (!pubkey) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Get relays from service
        const currentRelays = nostrService.getRelayStatus();
        setRelays(currentRelays);
        
        // If this is the current user, we already have their relays
        // Otherwise, try to fetch relays for this user from their metadata
        if (!isCurrentUser && pubkey) {
          try {
            // If the service supports getRelaysForUser, use it
            const userRelays = await adaptedNostrService.getRelaysForUser(pubkey);
            
            // If we got some relays, update our list with connection status "unknown"
            if (userRelays && userRelays.length > 0) {
              const newRelays = userRelays.map(url => ({
                url,
                status: 'unknown',
                read: true,
                write: true,
                score: 50
              }));
              
              // Combine with current relays, avoiding duplicates
              const existingUrls = new Set(currentRelays.map(r => r.url));
              const uniqueNewRelays = newRelays.filter(r => !existingUrls.has(r.url));
              
              setRelays([...currentRelays, ...uniqueNewRelays]);
            }
          } catch (err) {
            console.warn("Couldn't fetch relays for user:", err);
            // Don't set an error, just keep using the current relays
          }
        }
      } catch (err) {
        console.error("Error fetching relay information:", err);
        setError("Failed to load relay information");
      } finally {
        setLoading(false);
      }
    };
    
    fetchRelays();
  }, [pubkey, isCurrentUser]);
  
  // Add a relay for the current user
  const addRelay = useCallback(async (url: string) => {
    if (!isCurrentUser) {
      toast.error("You can only modify your own relays");
      return false;
    }
    
    try {
      setError(null);
      const formattedUrl = url.trim();
      
      // Basic URL validation
      if (!formattedUrl.startsWith('wss://')) {
        toast.error("Relay URL must start with wss://");
        return false;
      }
      
      // Add the relay
      const success = await adaptedNostrService.addRelay(formattedUrl);
      
      if (success) {
        // Get updated relay list
        const updatedRelays = nostrService.getRelayStatus();
        setRelays(updatedRelays);
        
        toast.success(`Added relay: ${formattedUrl}`);
        
        // Try to publish updated relay list using NIP-65
        try {
          const relayList = updatedRelays.map(relay => ({
            url: relay.url,
            read: relay.read !== false,
            write: relay.write !== false
          }));
          
          // This method might not exist in all implementations
          if (adaptedNostrService.publishRelayList) {
            adaptedNostrService.publishRelayList(relayList)
              .catch(e => console.warn("Error publishing relay list:", e));
          }
        } catch (e) {
          console.warn("Error publishing updated relay list:", e);
        }
        
        return true;
      } else {
        toast.error("Failed to add relay");
        return false;
      }
    } catch (err) {
      console.error("Error adding relay:", err);
      setError("Failed to add relay");
      toast.error("Error adding relay");
      return false;
    }
  }, [isCurrentUser]);
  
  // Remove a relay for the current user
  const removeRelay = useCallback((url: string) => {
    if (!isCurrentUser) {
      toast.error("You can only modify your own relays");
      return;
    }
    
    try {
      // Remove the relay
      adaptedNostrService.removeRelay(url);
      
      // Update the state
      setRelays(prev => prev.filter(relay => relay.url !== url));
      
      toast.success(`Removed relay: ${url}`);
      
      // Get updated relay list for NIP-65
      const updatedRelays = nostrService.getRelayStatus();
      
      // Try to publish updated relay list using NIP-65
      try {
        const relayList = updatedRelays.map(relay => ({
          url: relay.url,
          read: relay.read !== false,
          write: relay.write !== false
        }));
        
        // This method might not exist in all implementations
        if (adaptedNostrService.publishRelayList) {
          adaptedNostrService.publishRelayList(relayList)
            .catch(e => console.warn("Error publishing relay list:", e));
        }
      } catch (e) {
        console.warn("Error publishing updated relay list:", e);
      }
    } catch (err) {
      console.error("Error removing relay:", err);
      setError("Failed to remove relay");
      toast.error("Error removing relay");
    }
  }, [isCurrentUser]);

  return {
    relays,
    loading,
    error,
    addRelay,
    removeRelay
  };
}
