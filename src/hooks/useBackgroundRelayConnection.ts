import { useState, useEffect, useCallback, useRef } from 'react';
import { nostrService } from '@/lib/nostr';
import { eventBus, EVENTS } from '@/lib/services/EventBus';
import { useAppDispatch } from './redux';
import { updateConnectionStatus } from '@/store/slices/chatSlice';

export interface BackgroundRelayState {
  isConnecting: boolean;
  isConnected: boolean;
  connectedCount: number;
  totalCount: number;
  error: string | null;
  readyForFeeds: boolean;
}

/**
 * ✅ IMPROVED: Hook to manage background relay connections with Redux integration
 * Now updates Redux store to bridge the gap between actual relay status and UI display
 */
export function useBackgroundRelayConnection() {
  const dispatch = useAppDispatch();
  const [state, setState] = useState<BackgroundRelayState>({
    isConnecting: false,
    isConnected: false,
    connectedCount: 0,
    totalCount: 0,
    error: null,
    readyForFeeds: false,
  });

  // ✅ NEW: Connection throttling and status management
  const connectionLockRef = useRef(false);
  const lastConnectionAttemptRef = useRef(0);
  const MIN_CONNECTION_INTERVAL = 30000; // 30 seconds between attempts

  // Stabilize updates with refs to prevent rapid re-renders
  const lastStatusRef = useRef<{
    connectedCount: number;
    totalCount: number;
    isConnected: boolean;
  }>({ connectedCount: 0, totalCount: 0, isConnected: false });

  // ✅ ENHANCED: Update relay status with Redux integration
  const updateRelayStatus = useCallback(() => {
    try {
      const relays = nostrService.getRelayStatus();
      const connectedCount = relays.filter(r => r.status === 'connected').length;
      const totalCount = relays.length;
      const isConnected = connectedCount > 0;

      // Only update if values actually changed to prevent rapid re-renders
      const lastStatus = lastStatusRef.current;
      if (
        lastStatus.connectedCount !== connectedCount ||
        lastStatus.totalCount !== totalCount ||
        lastStatus.isConnected !== isConnected
      ) {
        lastStatusRef.current = { connectedCount, totalCount, isConnected };

        setState(prev => ({
          ...prev,
          connectedCount,
          totalCount,
          isConnected,
          readyForFeeds: isConnected,
          isConnecting: prev.isConnecting && !isConnected, // Stop showing connecting if we're connected
          error: isConnected ? null : prev.error, // Clear error if connected
        }));

        // ✅ FIXED: Always update Redux with proper relay counts, ensure minimum count for UI
        const effectiveTotalCount = Math.max(totalCount, 5); // Show at least 5 relays in UI
        dispatch(updateConnectionStatus({
          isConnected,
          connectedRelays: connectedCount,
          totalRelays: effectiveTotalCount,
        }));

        console.log(`[BackgroundRelay] Status update: ${connectedCount}/${effectiveTotalCount} relays connected - Redux updated`);
      }
    } catch (error) {
      console.warn('[BackgroundRelay] Error updating relay status:', error);
      
      // ✅ FIXED: Update Redux even on error to ensure status is never stale
      dispatch(updateConnectionStatus({
        isConnected: false,
        connectedRelays: 0,
        totalRelays: 5, // Default count for UI
      }));
    }
  }, [dispatch]);

  // ✅ IMPROVED: Connect to relays with throttling and better error handling
  const connectToRelays = useCallback(async () => {
    const now = Date.now();
    
    // Prevent spam connections
    if (connectionLockRef.current) {
      console.log('[BackgroundRelay] Connection already in progress, skipping');
      return;
    }
    
    // Throttle connection attempts
    if (now - lastConnectionAttemptRef.current < MIN_CONNECTION_INTERVAL) {
      const waitTime = MIN_CONNECTION_INTERVAL - (now - lastConnectionAttemptRef.current);
      console.log(`[BackgroundRelay] Throttling connection attempt, waiting ${Math.round(waitTime/1000)}s`);
      return;
    }

    // Check if we already have enough connections
    const currentRelays = nostrService.getRelayStatus();
    const connectedCount = currentRelays.filter(r => r.status === 'connected').length;
    if (connectedCount >= 2) { // Already have minimum connections
      console.log('[BackgroundRelay] Sufficient relays already connected');
      updateRelayStatus();
      return;
    }

    connectionLockRef.current = true;
    lastConnectionAttemptRef.current = now;
    
    setState(prev => {
      // Don't trigger if already connected
      if (prev.isConnected && prev.connectedCount >= 2) return prev;
      
      return { ...prev, isConnecting: true, error: null };
    });

    try {
      console.log('[BackgroundRelay] Attempting to connect to default relays with circuit breaker protection');
      
      // Use the improved core service with circuit breaker
      const connectedRelays = await nostrService.connectToDefaultRelays();
      
      if (connectedRelays.length > 0) {
        console.log(`[BackgroundRelay] Successfully connected to ${connectedRelays.length} relays:`, connectedRelays);
        
        setState(prev => ({
          ...prev,
          isConnecting: false,
          error: null,
        }));
      } else {
        console.warn('[BackgroundRelay] No relays connected');
        setState(prev => ({ 
          ...prev, 
          isConnecting: false, 
          error: 'No relays available - network may be experiencing issues' 
        }));
      }
      
      // Update status regardless of outcome
      updateRelayStatus();
      
    } catch (error) {
      console.error('[BackgroundRelay] Failed to connect to relays:', error);
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to network' 
      }));
    } finally {
      connectionLockRef.current = false;
    }
  }, [updateRelayStatus]);

  // ✅ IMPROVED: Initialize background connection with better timing
  useEffect(() => {
    // ✅ IMPROVED: Immediate status check on mount
    updateRelayStatus();
    
    // Delay initial connection to avoid race conditions during app startup
    const initialDelay = setTimeout(() => {
      connectToRelays();
    }, 1000); // 1 second delay

    // Listen for relay connection events with debouncing
    let updateTimeout: NodeJS.Timeout;
    const debouncedUpdate = () => {
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(updateRelayStatus, 500); // Increased debounce time
    };

    eventBus.on(EVENTS.RELAY_CONNECTED, debouncedUpdate);
    eventBus.on(EVENTS.RELAY_DISCONNECTED, debouncedUpdate);

    // ✅ IMPROVED: More frequent status checks for better UI responsiveness
    const statusInterval = setInterval(() => {
      // Only check status if not currently connecting
      if (!connectionLockRef.current) {
        updateRelayStatus();
      }
    }, 30000); // Every 30 seconds for better responsiveness

    // ✅ NEW: Periodic reconnection attempt for failed relays
    const reconnectInterval = setInterval(() => {
      // Only attempt reconnection if we have very few connections
      const currentRelays = nostrService.getRelayStatus();
      const connectedCount = currentRelays.filter(r => r.status === 'connected').length;
      
      if (connectedCount < 2 && !connectionLockRef.current) {
        console.log('[BackgroundRelay] Attempting periodic reconnection');
        connectToRelays();
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => {
      clearTimeout(initialDelay);
      clearInterval(statusInterval);
      clearInterval(reconnectInterval);
      clearTimeout(updateTimeout);
      eventBus.off(EVENTS.RELAY_CONNECTED, debouncedUpdate);
      eventBus.off(EVENTS.RELAY_DISCONNECTED, debouncedUpdate);
    };
  }, [updateRelayStatus, connectToRelays]);

  return {
    ...state,
    connectToRelays,
    // ✅ NEW: Manual status update for debugging/troubleshooting
    updateRelayStatus,
    // ✅ NEW: Force reconnection for troubleshooting
    forceReconnect: useCallback(async () => {
      console.log('[BackgroundRelay] Force reconnection requested');
      lastConnectionAttemptRef.current = 0; // Reset throttling
      connectionLockRef.current = false; // Reset lock
      await connectToRelays();
    }, [connectToRelays]),
  };
} 

