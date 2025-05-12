
import { nostrService } from "./index";
import { toast } from "sonner";

/**
 * Initialize Nostr connections after page load
 * This function should be called as early as possible when the application starts
 */
export async function initializeNostrConnections() {
  console.log("Initializing Nostr connections...");
  
  try {
    // Check if user was previously logged in
    const loginStatus = localStorage.getItem('nostr_login_status');
    if (loginStatus) {
      const status = JSON.parse(loginStatus);
      const timeSinceLogin = Date.now() - status.timestamp;
      
      // Only attempt reconnection if login was recent (within last hour)
      if (timeSinceLogin < 3600000) {
        console.log("Found recent login, attempting to restore connections");
        
        // First check if we have the public key available
        if (nostrService.publicKey) {
          console.log("Public key already available, restoring connections");
          
          // Try to connect to relays
          const connected = await nostrService.connectToUserRelays();
          
          if (connected) {
            console.log("Successfully restored relay connections");
          } else {
            console.warn("Failed to restore relay connections, trying default relays");
            await nostrService.connectToDefaultRelays();
          }
        } else {
          console.log("No public key available, attempting implicit login");
          
          // Try to re-login automatically if extension is available
          if (window.nostr) {
            try {
              const success = await nostrService.login();
              if (success) {
                console.log("Re-login successful, connecting to relays");
                await nostrService.connectToUserRelays();
              } else {
                console.warn("Silent re-login failed");
              }
            } catch (e) {
              console.error("Error during silent re-login:", e);
            }
          } else {
            console.warn("No nostr extension available for re-login");
          }
        }
      }
    } else {
      console.log("No previous login found");
    }
    
    // Initialize connection listeners
    setupConnectionListeners();
    
  } catch (error) {
    console.error("Error initializing Nostr connections:", error);
  }
}

/**
 * Set up event listeners for connection status changes
 */
function setupConnectionListeners() {
  // Listen for online/offline browser events
  window.addEventListener('online', () => {
    console.log("Browser went online");
    if (nostrService.publicKey) {
      // Try to reconnect when we come back online
      toast.promise(
        nostrService.connectToUserRelays(),
        {
          loading: "Reconnecting to Nostr network...",
          success: "Reconnected to Nostr network",
          error: "Failed to reconnect"
        }
      );
    }
  });
  
  window.addEventListener('offline', () => {
    console.log("Browser went offline");
    // No action needed, the ConnectionManager already handles this
  });
}

// Export initialization function
export default initializeNostrConnections;
