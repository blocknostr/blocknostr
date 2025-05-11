
import { SimplePool } from 'nostr-tools';
import { NostrEvent } from '../types';

export interface BaseServiceConfig {
  pool: SimplePool;
  getConnectedRelayUrls: () => string[];
  publicKey: string | null;
}

export interface SubscriptionResult<T> {
  data: T | null;
  subId: string;
}

export interface EventSubscription {
  filters: any[];
  onEvent: (event: NostrEvent) => void;
}
