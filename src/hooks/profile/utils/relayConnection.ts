
import { nostrService } from '@/lib/nostr';

/**
 * Connect to relays needed for profile fetching
 * @returns Promise that resolves when connected
 */
export const connectToProfileRelays = async (): Promise<void> => {
  try {
    // Connect to user's configured relays
    await nostrService.connectToUserRelays();
    
    // Add some popular relays to increase chances of finding the profile
    const additionalRelays = [
      "wss://relay.damus.io", 
      "wss://relay.nostr.band", 
      "wss://nos.lol"
    ];
    
    await nostrService.addMultipleRelays(additionalRelays);
    console.log("Connected to relays for profile fetching");
  } catch (error) {
    console.error("Error connecting to relays:", error);
    throw error;
  }
};
