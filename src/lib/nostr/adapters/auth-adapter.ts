
import { nostrService as originalNostrService } from '../service';
import { toast } from "sonner";

/**
 * Authentication-related adapter methods
 * Enhanced with better error handling and verification
 */
export class AuthAdapter {
  private service: typeof originalNostrService;
  
  constructor(service: typeof originalNostrService) {
    this.service = service;
  }

  /**
   * Get public key with verification
   */
  get publicKey() {
    const pubkey = this.service.publicKey;
    
    if (pubkey && typeof pubkey !== 'string') {
      console.error("Invalid public key format:", pubkey);
      return null;
    }
    
    return pubkey;
  }
  
  /**
   * Get following list
   */
  get following() {
    return this.service.following;
  }
  
  /**
   * Enhanced login with connection checking
   */
  async login() {
    try {
      console.log("Attempting login...");
      
      // Check relay connections before login
      const relayStatus = this.service.getRelayStatus();
      const connectedRelays = relayStatus.filter(r => r.status === 'connected');
      
      if (connectedRelays.length === 0) {
        console.log("No connected relays, attempting to connect...");
        await this.service.connectToUserRelays();
        
        // Check again after connection attempt
        const updatedStatus = this.service.getRelayStatus();
        if (updatedStatus.filter(r => r.status === 'connected').length === 0) {
          console.warn("Still no connected relays after connection attempt, continuing login but messages may fail");
        }
      }
      
      // Fix: Store the result and check it separately
      const result = await this.service.login();
      
      // Check the result
      if (result) {
        if (this.publicKey) {
          console.log(`Login successful with public key: ${this.publicKey}`);
          toast.success("Login successful");
        } else {
          console.warn("Login returned success but no public key is available");
          toast.warning("Login partial, no public key available");
        }
      } else {
        console.error("Login failed");
        toast.error("Login failed");
      }
      
      return result;
    } catch (error) {
      console.error("Error during login:", error);
      toast.error("Login error");
      return false;
    }
  }
  
  /**
   * Enhanced sign out method
   */
  signOut() {
    try {
      console.log("Signing out...");
      // Call the service method without checking its return value
      this.service.signOut();
      
      // Check authentication status after sign out
      if (!this.publicKey) {
        console.log("Sign out successful");
        toast.success("Signed out successfully");
        return true;
      } else {
        console.error("Sign out failed: public key still available");
        return false;
      }
    } catch (error) {
      console.error("Error during sign out:", error);
      return false;
    }
  }
  
  /**
   * Verify authentication status
   */
  isAuthenticated(): boolean {
    return !!this.publicKey;
  }
}
