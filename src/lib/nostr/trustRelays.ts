
import { Relay } from "./types";
import { isValidRelayUrl } from "./utils";

// Trust levels based on NIP-B7
export enum RelayTrustLevel {
  Default = 0,        // Unknown or default trust level
  Untrusted = 1,      // Explicitly untrusted relay
  ReadOnly = 2,       // Only trusted for reading
  Trusted = 3,        // Fully trusted relay
  Personal = 4        // Personal relay (highest trust)
}

export interface TrustedRelay extends Relay {
  trustLevel: RelayTrustLevel;
  lastChecked?: number;  // Timestamp of last connection check
  latency?: number;      // Response time in ms
}

// Default relays from the NIP-B7 reference implementation
const DEFAULT_TRUSTED_RELAYS: string[] = [
  "wss://relay.damus.io",
  "wss://relay.nostr.band", 
  "wss://nos.lol",
  "wss://nostr.bitcoiner.social"
];

export class TrustRelayManager {
  private _trustedRelays: Map<string, TrustedRelay> = new Map();
  private _loadedFromStorage: boolean = false;

  constructor() {
    this.loadFromStorage();
  }

  get trustedRelays(): TrustedRelay[] {
    return Array.from(this._trustedRelays.values());
  }

  public loadFromStorage(): void {
    try {
      const savedRelays = localStorage.getItem('nostr_trusted_relays');
      if (savedRelays) {
        const relaysArray = JSON.parse(savedRelays);
        relaysArray.forEach((relay: TrustedRelay) => {
          if (relay.url && isValidRelayUrl(relay.url)) {
            this._trustedRelays.set(relay.url, relay);
          }
        });
        this._loadedFromStorage = true;
      }
      
      // If no relays found in storage, initialize with defaults
      if (this._trustedRelays.size === 0) {
        this.initializeDefaultRelays();
      }
    } catch (e) {
      console.error('Error loading trusted relays from storage:', e);
      this.initializeDefaultRelays();
    }
  }

  public saveToStorage(): void {
    try {
      localStorage.setItem(
        'nostr_trusted_relays', 
        JSON.stringify(Array.from(this._trustedRelays.values()))
      );
    } catch (e) {
      console.error('Error saving trusted relays to storage:', e);
    }
  }

  public initializeDefaultRelays(): void {
    DEFAULT_TRUSTED_RELAYS.forEach(url => {
      if (!this._trustedRelays.has(url)) {
        this._trustedRelays.set(url, {
          url,
          status: 'disconnected',
          trustLevel: RelayTrustLevel.Default,
          read: true,
          write: true
        });
      }
    });
    this.saveToStorage();
  }

  public addOrUpdateRelay(
    url: string, 
    trustLevel: RelayTrustLevel, 
    read: boolean = true, 
    write: boolean = true
  ): boolean {
    if (!isValidRelayUrl(url)) {
      return false;
    }

    const existing = this._trustedRelays.get(url);
    
    this._trustedRelays.set(url, {
      url,
      status: existing?.status || 'disconnected',
      trustLevel,
      read,
      write,
      lastChecked: Date.now()
    });
    
    this.saveToStorage();
    return true;
  }

  public removeRelay(url: string): boolean {
    const success = this._trustedRelays.delete(url);
    if (success) {
      this.saveToStorage();
    }
    return success;
  }

  public getRelayTrustLevel(url: string): RelayTrustLevel {
    return this._trustedRelays.get(url)?.trustLevel || RelayTrustLevel.Default;
  }

  public updateRelayStatus(url: string, status: 'connected' | 'connecting' | 'disconnected' | 'error'): void {
    const relay = this._trustedRelays.get(url);
    if (relay) {
      relay.status = status;
      relay.lastChecked = Date.now();
      this._trustedRelays.set(url, relay);
      this.saveToStorage();
    }
  }

  public updateRelayLatency(url: string, latency: number): void {
    const relay = this._trustedRelays.get(url);
    if (relay) {
      relay.latency = latency;
      this._trustedRelays.set(url, relay);
      this.saveToStorage();
    }
  }

  // Get relays filtered by trust level
  public getRelaysByTrustLevel(minTrustLevel: RelayTrustLevel): TrustedRelay[] {
    return this.trustedRelays.filter(relay => relay.trustLevel >= minTrustLevel);
  }

  // Get relays suitable for publishing sensitive content (NIP-B7)
  public getPublishingRelays(): TrustedRelay[] {
    return this.trustedRelays.filter(
      relay => relay.trustLevel >= RelayTrustLevel.Trusted && relay.write
    );
  }

  // Get relays suitable for reading content
  public getReadingRelays(): TrustedRelay[] {
    return this.trustedRelays.filter(
      relay => relay.trustLevel >= RelayTrustLevel.ReadOnly && relay.read
    );
  }
}
