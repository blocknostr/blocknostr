
import { Event, SimplePool } from 'nostr-tools';
import { Filter } from 'nostr-tools';
import SubscriptionManager from '../subscription';
import { NostrRelayAdapter } from '../types/adapter';

class RelayAdapter implements NostrRelayAdapter {
  private relayUrls: string[] = [];
  private pool: SimplePool = new SimplePool();
  private connectedRelays = new Set<string>();

  constructor() {
    // Initialize default relays or load from preferences
  }

  async connect(relayUrls: string[]): Promise<void> {
    this.relayUrls = relayUrls;

    // Connect to each relay
    for (const url of this.relayUrls) {
      try {
        await this.pool.ensureRelay(url);
        this.connectedRelays.add(url);
        console.log(`Connected to relay: ${url}`);
      } catch (error) {
        console.error(`Failed to connect to relay ${url}:`, error);
      }
    }
  }

  disconnect(): void {
    try {
      this.pool.close(Array.from(this.connectedRelays));
      this.connectedRelays.clear();
      console.log('Disconnected from all relays');
    } catch (error) {
      console.error('Error disconnecting from relays:', error);
    }
  }

  async getEventById(id: string): Promise<Event | null> {
    try {
      const events = await this.pool.get(
        Array.from(this.connectedRelays),
        { ids: [id] }
      );
      return events || null;
    } catch (error) {
      console.error(`Error fetching event ${id}:`, error);
      return null;
    }
  }

  async getEvents(filter: Filter): Promise<Event[]> {
    try {
      return await this.pool.list(Array.from(this.connectedRelays), [filter]);
    } catch (error) {
      console.error(`Error fetching events:`, error);
      return [];
    }
  }

  subscribe(
    filters: Filter[],
    onEvent: (event: Event) => void,
    onEose?: () => void,
    onError?: (error: any) => void
  ): string {
    const sub = this.pool.sub(Array.from(this.connectedRelays), filters);
    
    // Create subscription ID and register handlers
    const subId = SubscriptionManager.subscribe(filters, onEvent, onEose, onError);
    
    // Handle events from the pool subscription
    sub.on('event', (event: Event, relay: any) => {
      SubscriptionManager.handleEvent(event, subId, relay.url);
    });
    
    sub.on('eose', () => {
      SubscriptionManager.handleEose(subId);
    });
    
    if (onError) {
      // Only attach error handler if provided
      sub.on('error', (error: any) => {
        if (error && error.relay && error.relay.url) {
          SubscriptionManager.handleRelayError(subId, error, error.relay.url);
        } else {
          // Fallback if relay info is not available
          SubscriptionManager.handleRelayError(subId, error, "unknown");
        }
      });
    }
    
    return subId;
  }

  unsubscribe(subscriptionId: string): void {
    SubscriptionManager.unsubscribe(subscriptionId);
  }

  async publishEvent(event: Event): Promise<string | null> {
    try {
      // Publish to all connected relays
      const pubResult = await this.pool.publish(Array.from(this.connectedRelays), event);
      
      // If at least one relay accepted the event, we consider it published
      for (const [url, result] of Object.entries(pubResult)) {
        if (result === true) {
          console.log(`Event published to ${url}`);
          return event.id;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error publishing event:', error);
      return null;
    }
  }

  getRelayUrls(): string[] {
    return Array.from(this.connectedRelays);
  }
}

export default RelayAdapter;
