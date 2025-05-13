
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
   */
  async getDirectMessages() {
    if (this.service.getDirectMessages) {
      return this.service.getDirectMessages();
    }
    return [];
  }
  
  /**
   * Get direct message conversation with a specific user
   */
  async getConversation(pubkey: string) {
    if (this.service.getConversation) {
      return this.service.getConversation(pubkey);
    }
    return [];
  }
}
