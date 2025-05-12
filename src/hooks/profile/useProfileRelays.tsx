
import { useState, useEffect, useCallback } from "react";
import { nostrService } from "@/lib/nostr";
import { Relay } from "@/lib/nostr/types";
import { toast } from "sonner";

interface UseProfileRelaysProps {
  pubkey: string | null;
  isCurrentUser: boolean;
}

export function useProfileRelays({ pubkey, isCurrentUser }: UseProfileRelaysProps) {
  const [relays, setRelays] = useState<Relay[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingRelays, setSavingRelays] = useState(false);
  
  // Load relays for the user
  const loadRelays = useCallback(async () => {
    if (!pubkey) return;
    
    setLoading(true);
    setLoadError(null);
    
    try {
      // First, get existing relay status
      const existingRelays = nostrService.getRelayStatus();
      
      // Then try to get relays from user's relay list
      const userRelays = await nostrService.getRelaysForUser(pubkey);
      
      // Combine the arrays and create a unique set
      const combinedRelays = [...existingRelays];
      
      // Add any user relays that don't exist in the combined array
      userRelays.forEach((relayUrl) => {
        if (!combinedRelays.some(r => r.url === relayUrl)) {
          combinedRelays.push({
            url: relayUrl,
            status: 'disconnected' as const,
            read: true,
            write: true
          });
        }
      });
      
      // Add score information to relays if not present
      const enhancedRelays = combinedRelays.map(relay => ({
        ...relay,
        score: relay.score !== undefined ? relay.score : 50,
        avgResponse: relay.avgResponse !== undefined ? relay.avgResponse : 500,
        circuitStatus: relay.circuitStatus || 'closed'
      }));
      
      setRelays(enhancedRelays as Relay[]);
    } catch (error) {
      console.error("Error loading relays:", error);
      setLoadError("Failed to load relays");
    } finally {
      setLoading(false);
    }
  }, [pubkey]);
  
  // Publish relay list to the network
  const publishRelayList = useCallback(async (relaysToPublish: Relay[]) => {
    if (!isCurrentUser) return false;
    
    try {
      setSavingRelays(true);
      
      // Filter out relays without read/write values and format for publishing
      const formatForNip65 = relaysToPublish
        .filter(relay => relay.read !== undefined && relay.write !== undefined) 
        .map(relay => ({
          url: relay.url,
          read: Boolean(relay.read),
          write: Boolean(relay.write)
        }));
      
      // Make sure all required fields are present
      if (formatForNip65.length === 0) {
        toast.error("No valid relays to publish");
        return false;
      }
      
      // Publish to network
      const success = await nostrService.publishRelayList(formatForNip65);
      
      if (success) {
        toast.success("Relay list published successfully");
        return true;
      } else {
        toast.error("Failed to publish relay list");
        return false;
      }
    } catch (error) {
      console.error("Error publishing relay list:", error);
      toast.error("Error publishing relay list");
      return false;
    } finally {
      setSavingRelays(false);
    }
  }, [isCurrentUser]);
  
  // Add a new relay
  const addRelay = useCallback(async (url: string) => {
    try {
      const success = await nostrService.addRelay(url);
      
      if (success) {
        // Update local relay list
        const updatedRelays: Relay[] = [
          ...relays,
          {
            url,
            status: 'connecting' as const,
            read: true,
            write: true,
            score: 50,
            avgResponse: 500,
            circuitStatus: 'closed'
          }
        ];
        
        setRelays(updatedRelays);
        
        // If current user, publish the updated list
        if (isCurrentUser) {
          publishRelayList(updatedRelays);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error adding relay:", error);
      return false;
    }
  }, [relays, isCurrentUser, publishRelayList]);
  
  // Remove a relay
  const removeRelay = useCallback((url: string) => {
    try {
      // Remove from service
      nostrService.removeRelay(url);
      
      // Update local state
      const updatedRelays = relays.filter(r => r.url !== url);
      setRelays(updatedRelays);
      
      // If current user, publish the updated list
      if (isCurrentUser) {
        publishRelayList(updatedRelays);
      }
      
      return true;
    } catch (error) {
      console.error("Error removing relay:", error);
      return false;
    }
  }, [relays, isCurrentUser, publishRelayList]);
  
  // Import multiple relays
  const importRelays = useCallback(async (urls: string[]) => {
    try {
      const addedCount = await nostrService.addMultipleRelays(urls);
      
      // Refresh relay list
      loadRelays();
      
      return addedCount;
    } catch (error) {
      console.error("Error importing relays:", error);
      return 0;
    }
  }, [loadRelays]);
  
  // Update a relay's read/write permissions
  const updateRelayPermissions = useCallback((url: string, read: boolean, write: boolean) => {
    try {
      const updatedRelays = relays.map(relay => 
        relay.url === url ? { ...relay, read, write } : relay
      );
      
      setRelays(updatedRelays);
      
      // If current user, publish the updated list
      if (isCurrentUser) {
        publishRelayList(updatedRelays);
      }
      
      return true;
    } catch (error) {
      console.error("Error updating relay permissions:", error);
      return false;
    }
  }, [relays, isCurrentUser, publishRelayList]);
  
  // Refresh relay list
  const refreshRelays = useCallback(() => {
    loadRelays();
  }, [loadRelays]);
  
  // Initial load
  useEffect(() => {
    if (pubkey) {
      loadRelays();
    }
  }, [pubkey, loadRelays]);

  return {
    relays,
    setRelays,
    loading,
    loadError,
    savingRelays,
    addRelay,
    removeRelay,
    updateRelayPermissions,
    importRelays,
    publishRelayList,
    refreshRelays
  };
}
