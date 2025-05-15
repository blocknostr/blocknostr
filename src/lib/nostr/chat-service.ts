
import { nostrService } from './index';
import { NostrEvent, NostrFilter } from './types';

/**
 * Chat-specific adapter for the NostrService
 * This provides a clean API for chat components to work with
 */
class ChatNostrService {
  /**
   * Get the public key from the nostr service
   */
  get publicKey(): string | null {
    return nostrService.getPublicKey?.() || null;
  }

  /**
   * Connect to user relays
   */
  async connectToUserRelays(): Promise<void> {
    return nostrService.connectToUserRelays();
  }

  /**
   * Subscribe to events with specified filters
   */
  subscribe(filters: NostrFilter[], onEvent: (event: NostrEvent) => void, relays?: string[]): string {
    return nostrService.subscribe?.(filters, onEvent, relays) || '';
  }

  /**
   * Unsubscribe from a subscription
   */
  unsubscribe(subId: string): void {
    if (nostrService.unsubscribe) {
      nostrService.unsubscribe(subId);
    }
  }

  /**
   * Publish an event
   */
  async publishEvent(eventData: { kind: number; content: string; tags: string[][] }): Promise<string | null> {
    try {
      const event = await nostrService.publishEvent?.(eventData);
      return event?.id || null;
    } catch (error) {
      console.error("Error publishing event:", error);
      return null;
    }
  }

  /**
   * Get relay status
   */
  getRelayStatus(): { url: string; status: string }[] {
    const status = nostrService.getRelayStatus?.() || [];
    // Convert numeric status to string status for type safety
    return status.map(relay => ({
      ...relay,
      status: relay.status === 1 ? 'connected' : relay.status === 3 ? 'connecting' : 'disconnected'
    }));
  }
}

export const chatNostrService = new ChatNostrService();
