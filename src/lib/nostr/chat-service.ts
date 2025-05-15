import { nostrService } from './service';
import { NostrAdapter } from './adapters';

class ChatNostrService extends NostrAdapter {
  getUserProfile = async (pubkey: string) => {
    return this.service.getUserProfile?.(pubkey) || this.service.data?.getUserProfile?.(pubkey) || null;
  }
  
  // Other chat-specific methods would go here
}

export const chatNostrService = new ChatNostrService(nostrService);
