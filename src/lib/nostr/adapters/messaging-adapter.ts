
import { BaseAdapter } from './base-adapter';

/**
 * Adapter for messaging operations
 */
export class MessagingAdapter extends BaseAdapter {
  /**
   * Send a direct message to a recipient
   */
  async sendDirectMessage(recipientPubkey: string, content: string) {
    return this.service.sendDirectMessage(recipientPubkey, content);
  }
  
  /**
   * Get direct messages for the current user
   * Note: Implementation stub since the base service doesn't have this method yet
   */
  async getDirectMessages() {
    // Stub implementation until the service implements this method
    console.warn('getDirectMessages is not fully implemented in the service yet');
    
    // If the service has the method, use it
    if (this.service.socialManager?.getDirectMessages) {
      return this.service.socialManager.getDirectMessages();
    }
    return [];
  }
  
  /**
   * Get direct message conversation with a specific user
   * Note: Implementation stub since the base service doesn't have this method yet
   */
  async getConversation(pubkey: string) {
    // Stub implementation until the service implements this method
    console.warn('getConversation is not fully implemented in the service yet');
    
    // If the service has the method, use it
    if (this.service.socialManager?.getConversation) {
      return this.service.socialManager.getConversation(pubkey);
    }
    return [];
  }
}
