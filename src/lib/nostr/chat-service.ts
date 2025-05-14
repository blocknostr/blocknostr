
import { NostrService } from './service';

// Create a dedicated Nostr service instance for chat functionality
const chatNostrServiceInstance = new NostrService();

// Export the chat-specific Nostr service
export const chatNostrService = chatNostrServiceInstance;
