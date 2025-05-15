
import { useState, useEffect } from 'react';
import { nostrService } from '@/lib/nostr';
import { toast } from 'sonner';

export function useEnhancedRelayConnection() {
  const [userRelays, setUserRelays] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(false);
  
  const currentUserPubkey = nostrService.publicKey;
  
  // Load user relays
  useEffect(() => {
    const loadUserRelays = async () => {
      setLoading(true);
      
      try {
        if (!currentUserPubkey) {
          setUserRelays([]);
          return;
        }
        
        // Get relays for user
        const relayData = await nostrService.getRelaysForUser(currentUserPubkey);
        
        if (relayData) {
          // Convert the relay data object to an array of URLs
          const relayUrls = Object.entries(relayData)
            .map(([url, config]) => url);
          
          setUserRelays(relayUrls);
        } else {
          setUserRelays([]);
        }
      } catch (error) {
        console.error("Error loading user relays:", error);
        toast.error("Failed to load user relays");
        setUserRelays([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserRelays();
  }, [currentUserPubkey]);
  
  // Add a relay to the user's list
  const addRelay = async (relayUrl: string): Promise<boolean> => {
    setAdding(true);
    
    try {
      // Add to user's local list
      if (!userRelays.includes(relayUrl)) {
        setUserRelays([...userRelays, relayUrl]);
      }
      
      // Connect to the relay
      const result = await nostrService.addRelay(relayUrl);
      
      if (result) {
        // Publish updated relay list
        const relaysToPublish = userRelays.map(url => ({
          url,
          read: true,
          write: true
        }));
        
        if (!userRelays.includes(relayUrl)) {
          relaysToPublish.push({
            url: relayUrl,
            read: true,
            write: true
          });
        }
        
        await nostrService.publishRelayList(relaysToPublish);
        
        toast.success(`Added relay: ${relayUrl}`);
        return true;
      } else {
        toast.error(`Failed to connect to relay: ${relayUrl}`);
        // Remove from list if connection failed
        setUserRelays(userRelays.filter(url => url !== relayUrl));
        return false;
      }
    } catch (error) {
      console.error("Error adding relay:", error);
      toast.error("Failed to add relay");
      return false;
    } finally {
      setAdding(false);
    }
  };
  
  // Remove a relay from the user's list
  const removeRelay = async (relayUrl: string): Promise<boolean> => {
    setRemoving(true);
    
    try {
      // Remove from user's local list
      setUserRelays(userRelays.filter(url => url !== relayUrl));
      
      // Disconnect from the relay
      nostrService.removeRelay(relayUrl);
      
      // Publish updated relay list
      const relaysToPublish = userRelays
        .filter(url => url !== relayUrl)
        .map(url => ({
          url,
          read: true,
          write: true
        }));
      
      await nostrService.publishRelayList(relaysToPublish);
      
      toast.success(`Removed relay: ${relayUrl}`);
      return true;
    } catch (error) {
      console.error("Error removing relay:", error);
      toast.error("Failed to remove relay");
      return false;
    } finally {
      setRemoving(false);
    }
  };
  
  return {
    userRelays,
    loading,
    adding,
    removing,
    addRelay,
    removeRelay,
    loadingRelays: loading,
    currentUserPubkey
  };
}
