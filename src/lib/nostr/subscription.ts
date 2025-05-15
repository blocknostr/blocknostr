
import { Event } from 'nostr-tools';
import { nostrService } from './';

export class SubscriptionManager {
  private subscriptions: Map<
    string,
    {
      filters: any[];
      callback: (event: Event) => void;
      onEose?: () => void;
      onError?: (error: any) => void;
      active: boolean;
    }
  > = new Map();

  private static instance: SubscriptionManager;

  private constructor() {}

  static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  subscribe(
    filters: any[],
    callback: (event: Event) => void,
    onEose?: () => void,
    onError?: (error: any) => void
  ): string {
    const id = `sub_${Math.random().toString(36).substring(2, 15)}`;
    this.subscriptions.set(id, {
      filters,
      callback,
      onEose,
      onError,
      active: true,
    });

    console.log(`[SubscriptionManager] Created subscription ${id}`);

    return id;
  }

  unsubscribe(id: string): boolean {
    if (!this.subscriptions.has(id)) {
      console.warn(`[SubscriptionManager] No subscription found with id ${id}`);
      return false;
    }

    console.log(`[SubscriptionManager] Unsubscribing from ${id}`);
    this.subscriptions.delete(id);
    return true;
  }

  handleEvent(event: Event, subId: string, relayUrl?: string): void {
    const subscription = this.subscriptions.get(subId);
    if (!subscription || !subscription.active) return;

    try {
      // Create a custom event object that includes relay URL
      const eventWithRelay = {
        ...event,
        relayUrl // Add the relay URL to the event object
      };
      
      subscription.callback(eventWithRelay as any);
    } catch (error) {
      console.error(
        `[SubscriptionManager] Error in callback for subscription ${subId}:`,
        error
      );
      if (subscription.onError) {
        subscription.onError(error);
      }
    }
  }

  handleEose(subId: string): void {
    const subscription = this.subscriptions.get(subId);
    if (!subscription || !subscription.active) return;

    if (subscription.onEose) {
      try {
        subscription.onEose();
      } catch (error) {
        console.error(
          `[SubscriptionManager] Error in EOSE callback for subscription ${subId}:`,
          error
        );
      }
    }
  }

  handleRelayError(subId: string, error: any, relayUrl: string): void {
    const subscription = this.subscriptions.get(subId);
    if (!subscription || !subscription.active) return;

    if (subscription.onError) {
      try {
        // Create an error object that includes the relay URL
        const errorWithRelay = {
          ...error,
          relayUrl
        };
        
        subscription.onError(errorWithRelay);
      } catch (internalError) {
        console.error(
          `[SubscriptionManager] Error in error callback for subscription ${subId}:`,
          internalError
        );
      }
    }
  }

  getSubscription(id: string) {
    return this.subscriptions.get(id);
  }

  getAllSubscriptionIds(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  pauseSubscription(id: string): boolean {
    const subscription = this.subscriptions.get(id);
    if (!subscription) return false;

    subscription.active = false;
    return true;
  }

  resumeSubscription(id: string): boolean {
    const subscription = this.subscriptions.get(id);
    if (!subscription) return false;

    subscription.active = true;
    return true;
  }

  updateSubscriptionFilters(id: string, filters: any[]): boolean {
    const subscription = this.subscriptions.get(id);
    if (!subscription) return false;

    subscription.filters = filters;
    return true;
  }
}

export default SubscriptionManager.getInstance();
