
import { useState, useEffect } from 'react';
import { nostrService, Relay } from '@/lib/nostr';
import { toast } from 'sonner';

interface UseProfileRelaysProps {
  isCurrentUser: boolean;
  pubkey?: string;
}

export function useProfileRelays({ isCurrentUser, pubkey }: UseProfileRelaysProps) {
  const [relays, setRelays] = useState<Relay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [healthCheckTimestamp, setHealthCheckTimestamp] = useState(Date.now());
  
  // Function to refresh relay status
  const refreshRelays = () => {
    if (isCurrentUser) {
      const relayStatus = nostrService.getRelayStatus();
      setRelays(relayStatus);
    }
    // Trigger health check UI update
    setHealthCheckTimestamp(Date.now());
  };
  
  // Load initial relay status
  useEffect(() => {
    if (isCurrentUser) {
      refreshRelays();
      
      // Set up periodic refresh every 10 seconds
      const intervalId = setInterval(refreshRelays, 10000);
      
      return () => clearInterval(intervalId);
    } else if (pubkey) {
      // Load relays for another user (NIP-65)
      loadUserRelays(pubkey);
    }
  }, [isCurrentUser, pubkey]);
  
  // Function to load another user's relays according to NIP-65
  const loadUserRelays = async (userPubkey: string) => {
    setIsLoading(true);
    try {
      // Subscribe to relay list events (NIP-65)
      const subId = nostrService.subscribe(
        [
          {
            kinds: [10002], // Relay List Metadata (NIP-65)
            authors: [userPubkey],
            limit: 1
          }
        ],
        (event) => {
          if (event.kind === 10002) {
            // Parse relay list from tags
            const relayObjects: Relay[] = [];
            
            event.tags.forEach(tag => {
              if (Array.isArray(tag) && tag[0] === 'r' && tag.length >= 2) {
                const url = tag[1];
                
                // Check for read/write markers
                let read = true;
                let write = true;
                
                if (tag.length >= 3) {
                  // Format is ["r", "wss://example.com", "read", "write"]
                  read = tag.includes('read');
                  write = tag.includes('write');
                }
                
                relayObjects.push({
                  url,
                  status: 'disconnected',
                  read,
                  write
                });
              }
            });
            
            setRelays(relayObjects);
          }
        }
      );
      
      // If no results after 3 seconds, fall back to a default list
      setTimeout(() => {
        if (relays.length === 0) {
          // Fallback to try default relays
          nostrService.getRelaysForUser(userPubkey)
            .then(userRelays => {
              // Convert to Relay objects with disconnected status
              const relayObjects: Relay[] = userRelays.map(url => ({
                url,
                status: 'disconnected',
                read: true,
                write: true
              }));
              
              setRelays(relayObjects);
            })
            .catch(error => {
              console.error("Error fetching default relays:", error);
              setRelays([]);
            });
        }
        
        nostrService.unsubscribe(subId);
        setIsLoading(false);
      }, 3000);
      
    } catch (error) {
      console.error("Error loading user relays:", error);
      toast.error("Failed to load user's relays");
      setIsLoading(false);
    }
  };

  // Function to publish user's relay preferences (NIP-65)
  const publishRelayList = async (relays: Relay[]): Promise<boolean> => {
    if (!isCurrentUser) return false;
    
    try {
      // Create relay list event according to NIP-65
      const event = {
        kind: 10002,
        content: '',
        tags: relays.map(relay => {
          const tag = ['r', relay.url];
          if (relay.read) tag.push('read');
          if (relay.write) tag.push('write');
          return tag;
        })
      };
      
      const eventId = await nostrService.publishEvent(event);
      if (eventId) {
        toast.success("Relay preferences updated");
        return true;
      } else {
        toast.error("Failed to update relay preferences");
        return false;
      }
    } catch (error) {
      console.error("Error publishing relay list:", error);
      toast.error("Failed to update relay preferences");
      return false;
    }
  };

  return { 
    relays, 
    setRelays, 
    isLoading, 
    refreshRelays,
    healthCheckTimestamp,
    publishRelayList
  };
}
