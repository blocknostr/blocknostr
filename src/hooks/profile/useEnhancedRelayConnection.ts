
import { useState, useEffect, useCallback } from "react";
import { Relay } from "@/lib/nostr/types";
import { CircuitState } from "@/lib/nostr/relay/circuit/circuit-breaker";
import { nostrService } from "@/lib/nostr";
import { toast } from "sonner";

/**
 * A hook for managing enhanced relay connections with circuit breaker
 */
export function useEnhancedRelayConnection() {
  const [relays, setRelays] = useState<Relay[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load initial relays
  useEffect(() => {
    const loadRelays = () => {
      try {
        const currentRelays = nostrService.getRelayStatus();
        
        // Add any missing fields with defaults
        const enhancedRelays = currentRelays.map(relay => ({
          ...relay,
          score: relay.score ?? 50,
          avgResponse: relay.avgResponse ?? 500,
          circuitStatus: (relay.circuitStatus as CircuitState) ?? 'closed',
          isRequired: relay.isRequired ?? false,
        }));
        
        setRelays(enhancedRelays);
      } catch (err) {
        console.error("Error loading relays:", err);
        setError("Failed to load relay information");
      }
    };
    
    loadRelays();
    
    // Set up interval to refresh relay status
    const intervalId = setInterval(() => {
      loadRelays();
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Connect to relays
  const connect = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      await nostrService.connectToUserRelays();
      
      // Update relay statuses
      const updatedRelays = nostrService.getRelayStatus();
      
      // Preserve additional metadata from existing relays
      const enhancedRelays = updatedRelays.map(relay => {
        const existingRelay = relays.find(r => r.url === relay.url);
        return {
          ...relay,
          score: existingRelay?.score ?? 50,
          avgResponse: existingRelay?.avgResponse ?? 500,
          circuitStatus: (existingRelay?.circuitStatus as CircuitState) ?? 'closed',
          isRequired: existingRelay?.isRequired ?? false,
        };
      });
      
      setRelays(enhancedRelays);
      
      const connectedCount = enhancedRelays.filter(r => r.status === 'connected').length;
      if (connectedCount === 0) {
        setError("Could not connect to any relays");
        return false;
      }
      
      return true;
    } catch (err) {
      console.error("Error connecting to relays:", err);
      setError("Failed to connect to relays");
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [relays]);
  
  // Update relay score based on performance
  const updateRelayScore = useCallback((url: string, success: boolean, responseTime: number = 500) => {
    setRelays(current => 
      current.map(relay => {
        if (relay.url !== url) return relay;
        
        // Calculate new score based on success/failure and response time
        let newScore = relay.score ?? 50;
        
        if (success) {
          // Reward fast responses
          if (responseTime < 200) newScore += 2;
          else if (responseTime < 500) newScore += 1;
          else if (responseTime > 1000) newScore -= 1;
        } else {
          // Penalize failures
          newScore -= 5;
        }
        
        // Bound score between 0 and 100
        newScore = Math.max(0, Math.min(100, newScore));
        
        // Update average response time
        let avgResponse = relay.avgResponse ?? responseTime;
        if (success) { // Only update avg on success
          avgResponse = (avgResponse * 0.7) + (responseTime * 0.3); // Weighted average
        }
        
        // Update circuit status
        let circuitStatus = relay.circuitStatus as CircuitState ?? 'closed';
        if (!success && circuitStatus === 'closed') {
          circuitStatus = 'half-open';
        } else if (!success && circuitStatus === 'half-open') {
          circuitStatus = 'open';
        } else if (success && circuitStatus !== 'closed') {
          circuitStatus = 'half-open'; // Start recovery
        }
        
        return {
          ...relay,
          score: newScore,
          avgResponse,
          circuitStatus
        };
      })
    );
  }, []);
  
  // Add a new relay with enhanced properties
  const addRelay = useCallback(async (url: string) => {
    try {
      const success = await nostrService.addRelay(url);
      
      if (success) {
        setRelays(current => [
          ...current,
          {
            url,
            status: 'connecting',
            read: true,
            write: true,
            score: 50,
            avgResponse: 500,
            circuitStatus: 'closed',
            isRequired: false
          }
        ]);
        
        toast.success(`Added relay: ${url}`);
        return true;
      } else {
        toast.error(`Failed to add relay: ${url}`);
        return false;
      }
    } catch (err) {
      console.error(`Error adding relay ${url}:`, err);
      toast.error(`Error adding relay: ${url}`);
      return false;
    }
  }, []);
  
  // Remove relay
  const removeRelay = useCallback((url: string) => {
    try {
      nostrService.removeRelay(url);
      
      setRelays(current => 
        current.filter(relay => relay.url !== url)
      );
      
      toast.success(`Removed relay: ${url}`);
      return true;
    } catch (err) {
      console.error(`Error removing relay ${url}:`, err);
      toast.error(`Error removing relay: ${url}`);
      return false;
    }
  }, []);
  
  return {
    relays,
    isConnecting,
    error,
    connect,
    updateRelayScore,
    addRelay,
    removeRelay
  };
}
