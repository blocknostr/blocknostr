
import { nostrService } from '@/lib/nostr';
import { adaptedNostrService } from '@/lib/nostr/nostr-adapter';
import { Relay } from '@/lib/nostr';
import { relaySelector } from '@/lib/nostr/relay/selection/relay-selector';

/**
 * Connect to appropriate relays for profile operations
 * Returns an array of connected relay URLs
 */
export async function connectToProfileRelays(): Promise<string[] | null> {
  try {
    // First check if we're already connected to any relays
    const relayStatus = nostrService.getRelayStatus();
    const connectedRelays = relayStatus.filter(r => r.status === 'connected');
    
    if (connectedRelays.length > 0) {
      // We already have connections, no need to reconnect
      return connectedRelays.map(r => r.url);
    }
    
    // Try to connect to user's saved relays first
    let connected = false;
    try {
      await nostrService.connectToUserRelays();
      
      // Check if any connections were established
      const updatedStatus = nostrService.getRelayStatus();
      connected = updatedStatus.some(r => r.status === 'connected');
    } catch (userRelaysError) {
      console.warn("Failed to connect to user relays:", userRelaysError);
    }
    
    // If still not connected, try default relays
    if (!connected) {
      try {
        await nostrService.connectToDefaultRelays();
      } catch (defaultRelaysError) {
        console.warn("Failed to connect to default relays:", defaultRelaysError);
      }
    }
    
    // If still not connected, try some popular relays as a last resort
    const finalStatus = nostrService.getRelayStatus();
    const finalConnected = finalStatus.filter(r => r.status === 'connected');
    
    if (finalConnected.length === 0) {
      const popularRelays = [
        "wss://relay.damus.io",
        "wss://nos.lol",
        "wss://relay.nostr.band",
        "wss://relay.snort.social",
        "wss://eden.nostr.land"
      ];
      
      // Use relay selector to pick best ones based on past performance
      const bestRelays = relaySelector.selectBestRelays(popularRelays, {
        operation: 'both',
        count: 4
      });
      
      await adaptedNostrService.addMultipleRelays(bestRelays);
    }
    
    // Return final list of connected relays
    const finalRelayStatus = nostrService.getRelayStatus();
    const connectedRelayUrls = finalRelayStatus
      .filter(r => r.status === 'connected')
      .map(r => r.url);
    
    return connectedRelayUrls.length > 0 ? connectedRelayUrls : null;
  } catch (error) {
    console.error("Error connecting to profile relays:", error);
    return null;
  }
}

/**
 * Ensure profile fetching happens with maximum relay coverage
 */
export async function ensureProfileRelayConnections(pubkey: string | null): Promise<boolean> {
  if (!pubkey) return false;
  
  try {
    // First check if any relays are already connected
    const relayStatus = nostrService.getRelayStatus();
    const connectedRelays = relayStatus.filter(r => r.status === 'connected');
    
    if (connectedRelays.length > 0) {
      return true;
    }
    
    // Connect to profile relays
    const connectedRelayUrls = await connectToProfileRelays();
    return connectedRelayUrls !== null && connectedRelayUrls.length > 0;
  } catch (error) {
    console.error("Error ensuring profile relay connections:", error);
    return false;
  }
}
