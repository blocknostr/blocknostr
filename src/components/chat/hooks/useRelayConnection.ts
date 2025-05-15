
import { useState, useCallback, useEffect } from "react";
import { chatNostrService } from "@/lib/nostr/chat-service";
import { toast } from "sonner";
import { retry } from "@/lib/utils/retry";

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

const RETRY_INTERVAL = 5000; // 5 seconds for retry
const RECONNECT_ATTEMPTS = 3;

/**
 * Hook to manage relay connection status and reconnection logic
 */
export const useRelayConnection = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Function to get relay connection status
  const updateConnectionStatus = useCallback(() => {
    const relays = chatNostrService.getRelayStatus();
    const connected = relays.filter(r => {
      // Convert status to string for comparison to handle mixed types
      const status = String(r.status);
      return status === '1' || status === 'connected';
    }).length;
    
    if (connected > 0) {
      setConnectionStatus('connected');
      setError(null);
    } else if (relays.length === 0 || !navigator.onLine) {
      setConnectionStatus('disconnected');
    } else {
      setConnectionStatus('connecting');
    }
  }, []);

  // Connect to relays with retry logic
  const connectToRelays = useCallback(async () => {
    try {
      await retry(
        async () => {
          await chatNostrService.connectToUserRelays();
          const relays = chatNostrService.getRelayStatus();
          const connected = relays.filter(r => {
            // Convert status to string for comparison
            const status = String(r.status);
            return status === '1' || status === 'connected';
          }).length;
          if (connected === 0) throw new Error("No relays connected");
          return connected;
        },
        {
          maxAttempts: RECONNECT_ATTEMPTS,
          baseDelay: 1000,
          onRetry: (attempt) => {
            console.log(`Retry #${attempt} connecting to relays for chat...`);
            setConnectionStatus('connecting');
          }
        }
      );
      
      updateConnectionStatus();
      return true;
    } catch (error) {
      console.error("Failed to connect to any relays for chat:", error);
      setConnectionStatus('disconnected');
      setError("Unable to connect to relays. Please try again later.");
      return false;
    }
  }, [updateConnectionStatus]);

  // Manual reconnect function for user-initiated reconnection
  const reconnect = async () => {
    if (isReconnecting) return;
    
    try {
      setIsReconnecting(true);
      toast.loading("Reconnecting to chat relays...");
      await chatNostrService.connectToUserRelays();
      updateConnectionStatus();
      toast.success("Chat reconnection attempt completed");
    } catch (err) {
      toast.error("Failed to reconnect chat");
      console.error("Chat reconnection error:", err);
    } finally {
      setIsReconnecting(false);
    }
  };

  // Setup connection status check interval
  useEffect(() => {
    connectToRelays();
    
    // Set up connection status check interval
    const statusInterval = setInterval(updateConnectionStatus, RETRY_INTERVAL);
    
    // Cleanup function
    return () => {
      clearInterval(statusInterval);
    };
  }, [connectToRelays, updateConnectionStatus]);

  return {
    connectionStatus,
    error,
    isReconnecting,
    reconnect,
    updateConnectionStatus
  };
};
