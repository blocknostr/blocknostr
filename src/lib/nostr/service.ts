import { generatePrivateKey, getPublicKey, nip19, SimplePool, Sub, Filter } from 'nostr-tools';
import { Relay, NostrEvent } from './types';
import { fetchAllEvents } from './utils';
import { EVENT_KINDS, DEFAULT_RELAYS } from './constants';
import { ProfileService } from './services/profile-service';
import { EventService } from './services/event-service';
import { verifyNip05, fetchNip05Data } from './nip05';
import { getRelayInit } from './relay/relay-utils';
import { cacheManager } from '@/lib/utils/cacheManager';

export class NostrService {
  private pool: SimplePool;
  private privateKey: string | null = null;
  private publicKey: string | null = null;
  private relays: Relay[] = [];
  private profileService: ProfileService | null = null;
  private eventService: EventService | null = null;
  
  constructor() {
    this.pool = new SimplePool();
    this.loadKeys();
    this.connectToDefaultRelays();
  }

  isLoggedIn(): boolean {
    return !!this.publicKey && !!this.privateKey;
  }

  getPrivateKey(): string | null {
    return this.privateKey;
  }

  getPublicKey(): string | null {
    return this.publicKey;
  }

  setPrivateKey(privateKey: string): void {
    this.privateKey = privateKey;
    this.publicKey = getPublicKey(privateKey);
    localStorage.setItem('privateKey', privateKey);
    localStorage.setItem('publicKey', this.publicKey);
    this.profileService = new ProfileService(this.pool, this.getConnectedRelayUrls.bind(this));
    this.eventService = new EventService(this.pool, this.getConnectedRelayUrls.bind(this));
  }

  loadKeys(): void {
    const storedPrivateKey = localStorage.getItem('privateKey');
    const storedPublicKey = localStorage.getItem('publicKey');
    if (storedPrivateKey && storedPublicKey) {
      try {
        this.privateKey = storedPrivateKey;
        this.publicKey = storedPublicKey
        this.profileService = new ProfileService(this.pool, this.getConnectedRelayUrls.bind(this));
        this.eventService = new EventService(this.pool, this.getConnectedRelayUrls.bind(this));
      } catch (error) {
        console.error("Error loading keys from local storage:", error);
        this.clearKeys();
      }
    }
  }

  clearKeys(): void {
    this.privateKey = null;
    this.publicKey = null;
    localStorage.removeItem('privateKey');
    localStorage.removeItem('publicKey');
    this.profileService = null;
    this.eventService = null;
  }

  generateKeys(): { privateKey: string; publicKey: string } {
    const privateKey = generatePrivateKey();
    const publicKey = getPublicKey(privateKey);
    return { privateKey, publicKey };
  }

  getNpubFromHex(hexPubkey: string): string {
    try {
      return nip19.npubEncode(hexPubkey);
    } catch (error) {
      console.error("Error encoding pubkey:", error);
      return hexPubkey;
    }
  }
  
  getHexFromNpub(npub: string): string | null {
    try {
      const decoded = nip19.decode(npub);
      if (decoded && decoded.type === 'npub') {
        return decoded.data as string;
      }
      return null;
    } catch (error) {
      console.error("Error decoding npub:", error);
      return null;
    }
  }

  formatPubkey(pubkey: string): string {
    try {
      return nip19.npubEncode(pubkey);
    } catch (error) {
      console.error("Error formatting pubkey:", error);
      return pubkey;
    }
  }

  async signEvent(event: any): Promise<any> {
    if (!window.nostr) {
      throw new Error('Nostr extension not found');
    }
    return window.nostr.signEvent(event);
  }

  async getRelays(): Promise<Relay[]> {
    try {
      const pubkey = this.publicKey;
      if (!pubkey) {
        console.warn("No pubkey available to fetch relays.");
        return [];
      }
      
      const connectedRelays = this.getConnectedRelayUrls();
      
      const filters: Filter[] = [{
        kinds: [3, 10002],
        authors: [pubkey]
      }];
      
      const events = await fetchAllEvents(this.pool, connectedRelays, filters);
      
      if (!events || events.length === 0) {
        console.log("No relay list events found, using default relays.");
        return DEFAULT_RELAYS;
      }
      
      const relays = events.reduce((acc: Relay[], event: NostrEvent) => {
        if (event.kind === 3) {
          try {
            const content = JSON.parse(event.content);
            Object.entries(content).forEach(([url, readWrite]) => {
              acc.push({ url, read: readWrite as boolean, write: readWrite as boolean });
            });
          } catch (error) {
            console.error("Error parsing relay list event:", error);
          }
        } else if (event.kind === 10002) {
          try {
            event.tags.forEach(tag => {
              if (tag[0] === 'r') {
                const url = tag[1];
                const read = tag[2] !== 'write';
                const write = tag[2] !== 'read';
                acc.push({ url, read, write });
              }
            });
          } catch (error) {
            console.error("Error parsing NIP-65 event:", error);
          }
        }
        return acc;
      }, []);
      
      // Deduplicate relays
      const uniqueRelays = Array.from(new Set(relays.map(r => r.url)))
        .map(url => {
          const relay = relays.find(r => r.url === url);
          return {
            url: relay?.url || url,
            read: relay?.read || false,
            write: relay?.write || false
          };
        });
      
      return uniqueRelays;
    } catch (error) {
      console.error("Error fetching relays:", error);
      return DEFAULT_RELAYS;
    }
  }

  async addRelay(relayUrl: string, readWrite: boolean = true): Promise<boolean> {
    if (!this.relays.find(relay => relay.url === relayUrl)) {
      try {
        const relayInit = getRelayInit(relayUrl);
        if (!relayInit) {
          console.warn(`Invalid relay URL: ${relayUrl}`);
          return false;
        }
        
        const relay = this.pool.ensureRelay(relayUrl, {});
        
        relay.on('connect', () => {
          console.log(`Connected to relay: ${relayUrl}`);
          window.dispatchEvent(new CustomEvent('relay-connected', { detail: relayUrl }));
        });
        
        relay.on('disconnect', () => {
          console.log(`Disconnected from relay: ${relayUrl}`);
          window.dispatchEvent(new CustomEvent('relay-disconnected', { detail: relayUrl }));
        });
        
        relay.on('error', () => {
          console.error(`Error connecting to relay: ${relayUrl}`);
          window.dispatchEvent(new CustomEvent('relay-error', { detail: relayUrl }));
        });
        
        this.relays.push({ url: relayUrl, read: readWrite, write: readWrite });
        localStorage.setItem('relays', JSON.stringify(this.relays));
        return true;
      } catch (error) {
        console.error(`Error adding relay ${relayUrl}:`, error);
        return false;
      }
    }
    return false;
  }

  removeRelay(relayUrl: string): boolean {
    const index = this.relays.findIndex(relay => relay.url === relayUrl);
    if (index > -1) {
      this.relays.splice(index, 1);
      localStorage.setItem('relays', JSON.stringify(this.relays));
      this.pool.removeRelay(relayUrl)
      return true;
    }
    return false;
  }

  getRelayStatus(): { url: string; status: number }[] {
    return this.relays.map(relay => {
      const relayInstance = this.pool.getRelay(relay.url);
      return {
        url: relay.url,
        status: relayInstance?.status || 0
      };
    });
  }

  getConnectedRelayUrls(): string[] {
    return this.relays
      .filter(relay => this.pool.getRelay(relay.url)?.status === 1)
      .map(relay => relay.url);
  }

  async connectToDefaultRelays(): Promise<void> {
    let storedRelays = localStorage.getItem('relays');
    if (!storedRelays) {
      this.relays = DEFAULT_RELAYS;
      localStorage.setItem('relays', JSON.stringify(this.relays));
    } else {
      try {
        this.relays = JSON.parse(storedRelays);
      } catch (error) {
        console.error("Error parsing stored relays, falling back to default:", error);
        this.relays = DEFAULT_RELAYS;
        localStorage.setItem('relays', JSON.stringify(this.relays));
      }
    }

    for (const relay of this.relays) {
      try {
        const relayInit = getRelayInit(relay.url);
        if (!relayInit) {
          console.warn(`Invalid relay URL: ${relay.url}`);
          continue;
        }
        
        const relayInstance = this.pool.ensureRelay(relay.url, {});
        
        relayInstance.on('connect', () => {
          console.log(`Connected to relay: ${relay.url}`);
          window.dispatchEvent(new CustomEvent('relay-connected', { detail: relay.url }));
        });
        
        relayInstance.on('disconnect', () => {
          console.log(`Disconnected from relay: ${relay.url}`);
          window.dispatchEvent(new CustomEvent('relay-disconnected', { detail: relay.url }));
        });
        
        relayInstance.on('error', () => {
          console.error(`Error connecting to relay: ${relay.url}`);
          window.dispatchEvent(new CustomEvent('relay-error', { detail: relay.url }));
        });
      } catch (error) {
        console.error(`Failed to connect to relay ${relay.url}:`, error);
      }
    }
  }
  
  async connectToUserRelays(): Promise<void> {
    if (!this.publicKey) {
      console.warn("No pubkey available to fetch relays.");
      return;
    }
    
    try {
      const relays = await this.getRelays();
      
      if (!relays || relays.length === 0) {
        console.log("No relay list events found, using default relays.");
        return;
      }
      
      for (const relay of relays) {
        try {
          const relayInit = getRelayInit(relay.url);
          if (!relayInit) {
            console.warn(`Invalid relay URL: ${relay.url}`);
            continue;
          }
          
          const relayInstance = this.pool.ensureRelay(relay.url, {});
          
          relayInstance.on('connect', () => {
            console.log(`Connected to relay: ${relay.url}`);
            window.dispatchEvent(new CustomEvent('relay-connected', { detail: relay.url }));
          });
          
          relayInstance.on('disconnect', () => {
            console.log(`Disconnected from relay: ${relay.url}`);
            window.dispatchEvent(new CustomEvent('relay-disconnected', { detail: relay.url }));
          });
          
          relayInstance.on('error', () => {
            console.error(`Error connecting to relay: ${relay.url}`);
            window.dispatchEvent(new CustomEvent('relay-error', { detail: relay.url }));
          });
        } catch (error) {
          console.error(`Failed to connect to relay ${relay.url}:`, error);
        }
      }
    } catch (error) {
      console.error("Error fetching relays:", error);
    }
  }

  async publish(relays: string[], event: any, privateKey?: string): Promise<any> {
    if (!privateKey && !window.nostr) {
      throw new Error('No private key provided and Nostr extension not found');
    }
    
    if (privateKey) {
      event.sig = await this.signWithPrivateKey(event, privateKey);
      
      return new Promise((resolve) => {
        let pub = this.pool.publish(relays, event);
        pub.on('ok', (relay: string) => {
          console.log(`Event published to ${relay}`);
          resolve(event);
        });
        pub.on('failed', (relay: string) => {
          console.log(`Failed to publish to ${relay}`);
        });
      });
    } else if (window.nostr) {
      const signedEvent = await this.signEvent(event);
      
      return new Promise((resolve) => {
        let pub = this.pool.publish(relays, signedEvent);
        pub.on('ok', (relay: string) => {
          console.log(`Event published to ${relay}`);
          resolve(signedEvent);
        });
        pub.on('failed', (relay: string) => {
          console.log(`Failed to publish to ${relay}`);
        });
      });
    }
  }

  async signWithPrivateKey(event: any, privateKey: string): Promise<string> {
    if (!this.eventService) {
      throw new Error('Event service not initialized');
    }
    return this.eventService.signEvent(event, privateKey);
  }

  async getEventById(id: string): Promise<NostrEvent | null> {
    if (!this.eventService) {
      throw new Error('Event service not initialized');
    }
    return this.eventService.getEventById(id);
  }

  async getEvents(ids: string[]): Promise<NostrEvent[]> {
     if (!this.eventService) {
      throw new Error('Event service not initialized');
    }
    return this.eventService.getEvents(ids);
  }

  async getProfilesByPubkeys(pubkeys: string[]): Promise<Record<string, any>> {
    if (!this.profileService) {
      throw new Error('Profile service not initialized');
    }
    
    try {
      const connectedRelays = this.getConnectedRelayUrls();
      
      return new Promise((resolve) => {
        const filters: Filter[] = [{
          kinds: [EVENT_KINDS.META],
          authors: pubkeys,
          limit: pubkeys.length
        }];
        
        let events: NostrEvent[] = [];
        let sub: Sub | null = null;
        
        try {
          sub = this.pool.sub(
            connectedRelays,
            filters
          );
          
          sub.on('event', (event) => {
            events.push(event);
          });
          
          sub.on('eose', () => {
            const profiles: Record<string, any> = {};
            events.forEach(event => {
              try {
                const profile = JSON.parse(event.content);
                profiles[event.pubkey] = profile;
              } catch (e) {
                console.error("Error parsing profile:", e);
              }
            });
            resolve(profiles);
            
            // Cleanup subscription after receiving the profiles
            setTimeout(() => {
              if (sub) {
                sub.unsub();
              }
            }, 100);
          });
        } catch (error) {
          console.error("Error in subscription:", error);
          resolve({});
        }
        
        // Set a timeout to resolve with an empty object if no profiles are found
        setTimeout(() => {
          if (sub) {
            sub.unsub();
          }
          
          const profiles: Record<string, any> = {};
          events.forEach(event => {
            try {
              const profile = JSON.parse(event.content);
              profiles[event.pubkey] = profile;
            } catch (e) {
              console.error("Error parsing profile:", e);
            }
          });
          resolve(profiles);
        }, 5000);
      });
    } catch (error) {
      console.error("Error fetching user profiles:", error);
      return {};
    }
  }

  async getUserProfile(pubkey: string): Promise<{
    name?: string;
    display_name?: string;
    picture?: string;
    nip05?: string;
    about?: string;
    banner?: string;
    website?: string;
    lud16?: string;
    created_at?: number;
    [key: string]: any;
  } | null> {
    if (!this.profileService) {
      console.error('Profile service not initialized');
      return null;
    }
    return this.profileService.getUserProfile(pubkey);
  }

  async verifyNip05(identifier: string, pubkey: string): Promise<boolean> {
    if (!this.profileService) {
      console.error('Profile service not initialized');
      return false;
    }
    return this.profileService.verifyNip05(identifier, pubkey);
  }

  /**
   * Publish a metadata event (kind 0) with profile information
   * Implements NIP-01 profile metadata
   * @param metadata - Profile metadata object (name, display_name, about, picture, etc.)
   * @returns The published event or null if failed
   */
  async publishMetadata(
    metadata: {
      name?: string;
      display_name?: string;
      about?: string;
      picture?: string;
      banner?: string;
      website?: string;
      nip05?: string;
      lud16?: string;
      [key: string]: any;
    }
  ): Promise<NostrEvent | null> {
    if (!this.profileService) {
      console.error('Profile service not initialized');
      return null;
    }
    
    if (!this.isLoggedIn()) {
      console.error('User not logged in');
      return null;
    }
    
    return this.profileService.publishMetadata(metadata, this.privateKey || undefined);
  }
}

export const nostrService = new NostrService();
