
import { nostrService as originalNostrService } from '../service';
import { NostrEvent } from '../types';
import { toast } from "sonner";

/**
 * Event handling adapter methods
 * Enhanced with better error handling and retry mechanisms
 */
export class EventAdapter {
  private service: typeof originalNostrService;
  private readonly MAX_RETRIES = 2;
  private readonly RETRY_DELAY = 2000; // ms
  
  constructor(service: typeof originalNostrService) {
    this.service = service;
  }

  /**
   * Publish event with retry logic
   */
  async publishEvent(event: any, relays?: string[], options?: { noRetry?: boolean }): Promise<string | null> {
    // Don't retry if explicitly disabled
    const shouldRetry = !options?.noRetry;
    
    try {
      console.log("Publishing event:", JSON.stringify(event, null, 2));
      
      // Check if we are connected to relays
      const relayStatus = this.service.getRelayStatus();
      const connectedRelays = relayStatus.filter(r => r.status === 'connected');
      
      if (connectedRelays.length === 0) {
        console.error("Cannot publish: No connected relays");
        
        // Try to connect if we have no connected relays
        if (shouldRetry) {
          console.log("Attempting to connect to relays before publishing...");
          await this.service.connectToUserRelays();
          
          // Check again after connection attempt
          const updatedStatus = this.service.getRelayStatus();
          if (!updatedStatus.some(r => r.status === 'connected')) {
            throw new Error('No connected relays available for publishing');
          }
        } else {
          throw new Error('No connected relays available for publishing');
        }
      }
      
      // Attempt to publish the event
      const result = await this.service.publishEvent(event, relays);
      
      if (result) {
        console.log(`Event published successfully with ID: ${result}`);
        return result;
      }
      
      throw new Error('Failed to publish event (null result)');
    } catch (error) {
      console.error("Error publishing event:", error);
      
      // Implement retry if enabled
      if (shouldRetry) {
        return this.retryPublishEvent(event, relays);
      }
      
      return null;
    }
  }
  
  /**
   * Retry publishing an event with backoff
   */
  private async retryPublishEvent(event: any, relays?: string[]): Promise<string | null> {
    let retries = 0;
    
    while (retries < this.MAX_RETRIES) {
      retries++;
      console.log(`Retrying publish event (attempt ${retries}/${this.MAX_RETRIES})...`);
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * retries));
      
      try {
        // Try connecting to relays again
        await this.service.connectToUserRelays();
        
        // Attempt to publish
        const result = await this.service.publishEvent(event, relays);
        
        if (result) {
          console.log(`Event published successfully on retry ${retries} with ID: ${result}`);
          return result;
        }
      } catch (retryError) {
        console.error(`Retry ${retries} failed:`, retryError);
      }
    }
    
    console.error(`Failed to publish event after ${this.MAX_RETRIES} retries`);
    toast.error("Failed to send message after multiple attempts");
    return null;
  }
  
  /**
   * Improved subscribe method with error handling
   */
  subscribe(filters: any[], onEvent: (event: any) => void, relays?: string[]) {
    try {
      console.log("Subscribing to events with filters:", JSON.stringify(filters, null, 2));
      
      // Verify we have relay connections
      const relayStatus = this.service.getRelayStatus();
      const connectedRelays = relayStatus.filter(r => r.status === 'connected');
      
      if (connectedRelays.length === 0) {
        console.warn("Subscribing with no connected relays, events may not be received");
      }
      
      // Wrap the onEvent callback to catch errors
      const safeCallback = (event: NostrEvent) => {
        try {
          onEvent(event);
        } catch (error) {
          console.error("Error in event subscription callback:", error);
        }
      };
      
      const subId = this.service.subscribe(filters, safeCallback, relays);
      console.log(`Subscription created with ID: ${subId}`);
      return subId;
    } catch (error) {
      console.error("Error creating subscription:", error);
      return `error-${Date.now()}`;
    }
  }
  
  unsubscribe(subId: string) {
    try {
      console.log(`Unsubscribing from ${subId}`);
      return this.service.unsubscribe(subId);
    } catch (error) {
      console.error(`Error unsubscribing from ${subId}:`, error);
    }
  }
  
  async getEventById(id: string) {
    try {
      console.log(`Getting event by ID: ${id}`);
      return this.service.getEventById(id);
    } catch (error) {
      console.error(`Error getting event ${id}:`, error);
      return null;
    }
  }
  
  async getEvents(ids: string[]) {
    try {
      console.log(`Getting multiple events: ${ids.join(', ')}`);
      return this.service.getEvents(ids);
    } catch (error) {
      console.error("Error getting events:", error);
      return [];
    }
  }
}
