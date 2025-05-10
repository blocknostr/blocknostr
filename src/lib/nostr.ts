import {
  generatePrivateKey,
  getPublicKey,
  nip19,
  relayInit,
  signEvent,
  validateEvent,
  verifySignature,
} from "nostr-tools";
import { Relay, Sub } from "nostr-tools";

export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export interface RelayStatus {
  url: string;
  status: "connecting" | "connected" | "disconnected" | "error";
}

class NostrService {
  private _publicKey: string | null = null;
  private _privateKey: string | null = null;
  private relays: string[] = [
    "wss://relay.damus.io",
    "wss://relay.snort.social",
    "wss://nostr.wine",
  ];
  private userRelays: string[] = [];
  private relayConnections: {
    [url: string]: { relay: Relay; status: RelayStatus["status"] };
  } = {};
  
  constructor() {
    this.loadKeys();
    this.connectToRelays();
  }
  
  public get publicKey(): string | null {
    return this._publicKey;
  }
  
  public get privateKey(): string | null {
    return this._privateKey;
  }

  private loadKeys() {
    const storedPrivateKey = localStorage.getItem("privateKey");
    if (storedPrivateKey) {
      try {
        const decoded = nip19.decode(storedPrivateKey);
        if (decoded.type === "nsec") {
          this._privateKey = decoded.data as string;
          this._publicKey = getPublicKey(this._privateKey);
        } else {
          console.warn("Invalid stored private key format");
          localStorage.removeItem("privateKey");
        }
      } catch (error) {
        console.error("Error decoding stored private key:", error);
        localStorage.removeItem("privateKey");
      }
    }
  }

  async generateNewKeys() {
    this._privateKey = generatePrivateKey();
    this._publicKey = getPublicKey(this._privateKey);
    
    // Store the private key securely (e.g., using nip19)
    const encodedPrivateKey = nip19.nsecretEncode(this._privateKey);
    localStorage.setItem("privateKey", encodedPrivateKey);
    
    return {
      publicKey: this._publicKey,
      privateKey: encodedPrivateKey,
    };
  }

  async setPrivateKey(privateKey: string) {
    try {
      const decoded = nip19.decode(privateKey);
      if (decoded.type === "nsec") {
        this._privateKey = decoded.data as string;
        this._publicKey = getPublicKey(this._privateKey);
        localStorage.setItem("privateKey", privateKey);
        return true;
      } else {
        console.warn("Invalid private key format");
        return false;
      }
    } catch (error) {
      console.error("Error setting private key:", error);
      return false;
    }
  }

  clearKeys() {
    this._privateKey = null;
    this._publicKey = null;
    localStorage.removeItem("privateKey");
  }

  async connectToRelays(customRelays?: string[]) {
    const relaysToConnect = customRelays || this.relays;
    
    relaysToConnect.forEach(async (relayUrl) => {
      if (this.relayConnections[relayUrl]) {
        // Already connected or connecting
        return;
      }
      
      this.relayConnections[relayUrl] = {
        relay: relayInit(relayUrl),
        status: "connecting",
      };
      
      try {
        this.relayConnections[relayUrl].relay.on("connect", () => {
          console.log(`Connected to relay: ${relayUrl}`);
          this.relayConnections[relayUrl].status = "connected";
        });
        
        this.relayConnections[relayUrl].relay.on("disconnect", () => {
          console.log(`Disconnected from relay: ${relayUrl}`);
          this.relayConnections[relayUrl].status = "disconnected";
        });
        
        this.relayConnections[relayUrl].relay.on("error", () => {
          console.error(`Error connecting to relay: ${relayUrl}`);
          this.relayConnections[relayUrl].status = "error";
        });
        
        await this.relayConnections[relayUrl].relay.connect();
      } catch (error) {
        console.error(`Failed to connect to ${relayUrl}:`, error);
        this.relayConnections[relayUrl].status = "error";
      }
    });
  }
  
  async connectToUserRelays() {
    if (!this.publicKey) return;
    
    // Subscribe to kind 3 event to get user's relay list
    const sub = this.subscribe(
      [
        {
          kinds: [3],
          authors: [this.publicKey],
          limit: 1
        }
      ],
      (event) => {
        try {
          // Extract relays from the 'r' tags in the event
          const relayTags = event.tags.filter(tag => tag[0] === 'r').map(tag => tag[1]);
          this.userRelays = relayTags;
          
          // Connect to these relays
          this.connectToRelays(this.userRelays);
        } catch (e) {
          console.error('Failed to parse user relays:', e);
        } finally {
          // Unsubscribe after processing the event
          this.unsubscribe(sub.id);
        }
      }
    );
  }

  getRelayStatus(): RelayStatus[] {
    return Object.entries(this.relayConnections).map(([url, connection]) => ({
      url,
      status: connection.status,
    }));
  }
  
  async connectToRelay(relayUrl: string): Promise<boolean> {
    if (this.relayConnections[relayUrl]) {
      // Already connected or connecting
      return true;
    }
    
    this.relayConnections[relayUrl] = {
      relay: relayInit(relayUrl),
      status: "connecting",
    };
    
    return new Promise((resolve) => {
      this.relayConnections[relayUrl].relay.on("connect", () => {
        console.log(`Connected to relay: ${relayUrl}`);
        this.relayConnections[relayUrl].status = "connected";
        resolve(true);
      });
      
      this.relayConnections[relayUrl].relay.on("disconnect", () => {
        console.log(`Disconnected from relay: ${relayUrl}`);
        this.relayConnections[relayUrl].status = "disconnected";
      });
      
      this.relayConnections[relayUrl].relay.on("error", () => {
        console.error(`Error connecting to relay: ${relayUrl}`);
        this.relayConnections[relayUrl].status = "error";
        resolve(false);
      });
      
      this.relayConnections[relayUrl].relay.connect().catch(() => {
        console.error(`Initial connection attempt failed for ${relayUrl}`);
        this.relayConnections[relayUrl].status = "error";
        resolve(false);
      });
    });
  }

  subscribe(
    filters: any[],
    callback: (event: NostrEvent) => void
  ): { id: string } {
    const sub = this.batchSubscribe(filters, callback);
    return { id: sub.id };
  }

  batchSubscribe(filters: any[], callback: (event: NostrEvent) => void): Sub {
    const sub = this.getRelayPool().subscribe(filters);

    sub.on("event", (event: NostrEvent) => {
      callback(event);
    });

    return sub;
  }

  unsubscribe(subscriptionId: string) {
    this.getRelayPool().unsubscribe(subscriptionId);
  }

  getRelayPool(): {
    subscribe: (filters: any[]) => Sub;
    unsubscribe: (id: string) => void;
  } {
    return {
      subscribe: (filters: any[]) => {
        const subs: Sub[] = [];
        Object.values(this.relayConnections).forEach((conn) => {
          if (conn.status === "connected") {
            try {
              const sub = conn.relay.sub(filters);
              subs.push(sub);
            } catch (e) {
              console.error("Relay subscription error", e);
            }
          }
        });

        return {
          on: (type: string, cb: (event: NostrEvent) => void) => {
            subs.forEach((sub) => {
              sub.on(type, cb);
            });
          },
          unsub: () => {
            subs.forEach((s) => s.unsub());
          },
        };
      },
      unsubscribe: (id: string) => {
        Object.values(this.relayConnections).forEach((conn) => {
          if (conn.status === "connected") {
            try {
              conn.relay.unsub(id);
            } catch (e) {
              console.error("Relay unsubscription error", e);
            }
          }
        });
      },
    };
  }

  async publish(event: any): Promise<boolean> {
    if (!this._privateKey) {
      console.error("Private key not available");
      return false;
    }

    try {
      const signedEvent = await this.signEvent(event);
      
      if (!signedEvent) {
        console.error("Failed to sign event");
        return false;
      }
      
      // Get connected relays
      const relays = this.getRelayStatus()
        .filter(relay => relay.status === 'connected')
        .map(relay => relay.url);
      
      if (relays.length === 0) {
        console.error("No connected relays available");
        return false;
      }
      
      // Publish to all connected relays
      const publishPromises = relays.map(relayUrl => {
        if (!this.relayConnections[relayUrl]?.relay) return Promise.resolve(false);
        
        return new Promise<boolean>((resolve) => {
          const pub = this.relayConnections[relayUrl].relay.publish(signedEvent);
          
          pub.on('ok', () => {
            console.log(`Published to ${relayUrl}`);
            resolve(true);
          });
          
          pub.on('failed', (reason: string) => {
            console.error(`Failed to publish to ${relayUrl}: ${reason}`);
            resolve(false);
          });
          
          // Set a timeout in case the relay doesn't respond
          setTimeout(() => {
            console.warn(`Publish to ${relayUrl} timed out`);
            resolve(false);
          }, 5000);
        });
      });
      
      // Consider success if at least one relay accepted the event
      const results = await Promise.all(publishPromises);
      return results.some(result => result === true);
    } catch (error) {
      console.error("Error publishing event:", error);
      return false;
    }
  }

  async signEvent(event: any): Promise<NostrEvent | null> {
    if (!this._privateKey) {
      console.error("No private key set");
      return null;
    }

    const newEvent = {
      ...event,
      pubkey: this._publicKey!,
    };

    const signedEvent = signEvent(newEvent, this._privateKey);

    if (validateEvent(signedEvent) && verifySignature(signedEvent)) {
      return signedEvent;
    } else {
      console.error("Invalid signature");
      return null;
    }
  }

  formatPubkey(pubkey: string): string {
    return nip19.npubEncode(pubkey);
  }

  getHexFromNpub(npub: string): string {
    try {
      const { data } = nip19.decode(npub);
      return data as string;
    } catch (error) {
      console.error("Error decoding npub:", error);
      return "";
    }
  }
  
  async publishProfileMetadata(metadata: any): Promise<boolean> {
    if (!this.privateKey) {
      console.error("Private key not available");
      return false;
    }

    try {
      const event = {
        kind: 0, // Profile metadata event kind
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: JSON.stringify(metadata),
      };

      const signedEvent = await this.signEvent(event);
      
      if (!signedEvent) {
        console.error("Failed to sign profile update event");
        return false;
      }
      
      // Get connected relays
      const relays = this.getRelayStatus()
        .filter(relay => relay.status === 'connected')
        .map(relay => relay.url);
      
      if (relays.length === 0) {
        console.error("No connected relays available");
        return false;
      }
      
      // Publish to all connected relays
      const publishPromises = relays.map(relayUrl => {
        if (!this.relayConnections[relayUrl]?.relay) return Promise.resolve(false);
        
        return new Promise<boolean>((resolve) => {
          const pub = this.relayConnections[relayUrl].relay.publish(signedEvent);
          
          pub.on('ok', () => {
            console.log(`Profile published to ${relayUrl}`);
            resolve(true);
          });
          
          pub.on('failed', (reason: string) => {
            console.error(`Failed to publish to ${relayUrl}: ${reason}`);
            resolve(false);
          });
          
          // Set a timeout in case the relay doesn't respond
          setTimeout(() => {
            console.warn(`Publish to ${relayUrl} timed out`);
            resolve(false);
          }, 5000);
        });
      });
      
      // Consider success if at least one relay accepted the event
      const results = await Promise.all(publishPromises);
      return results.some(result => result === true);
    } catch (error) {
      console.error("Error publishing profile metadata:", error);
      return false;
    }
  }
}

const nostrService = new NostrService();

export { nostrService };
export type { Relay };
