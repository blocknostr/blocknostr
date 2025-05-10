
import {
  nip19,
  relayInit,
  signEvent,
  validateEvent,
  verifySignature,
  getPublicKey,
} from "nostr-tools";
import { SimplePool } from "nostr-tools";
import { getEventHash } from "nostr-tools";
import { generatePrivateKey as generateNostrPrivateKey } from "nostr-tools/nip06";
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
  private _following: string[] = [];
  
  constructor() {
    this.loadKeys();
    this.connectToRelays();
    this.loadFollowing();
  }
  
  public get publicKey(): string | null {
    return this._publicKey;
  }
  
  public get privateKey(): string | null {
    return this._privateKey;
  }
  
  public get following(): string[] {
    return this._following;
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
  
  private loadFollowing() {
    if (!this._publicKey) return;
    
    // Try to load following list from localStorage first
    const storedFollowing = localStorage.getItem(`following_${this._publicKey}`);
    if (storedFollowing) {
      try {
        this._following = JSON.parse(storedFollowing);
      } catch (error) {
        console.error("Error parsing stored following list:", error);
      }
    }
    
    // Subscribe to kind 3 to get contacts
    this.subscribe(
      [
        {
          kinds: [3],
          authors: [this._publicKey],
          limit: 1
        }
      ],
      (event) => {
        // Extract pubkeys from p tags
        const contacts = event.tags
          .filter(tag => tag[0] === 'p')
          .map(tag => tag[1]);
          
        if (contacts.length > 0) {
          this._following = contacts;
          localStorage.setItem(`following_${this._publicKey}`, JSON.stringify(contacts));
        }
      }
    );
  }

  async generateNewKeys() {
    this._privateKey = generateNostrPrivateKey();
    this._publicKey = getPublicKey(this._privateKey);
    
    // Store the private key securely (e.g., using nip19)
    const encodedPrivateKey = nip19.nsecEncode(this._privateKey);
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
        
        // Load following list after setting key
        this.loadFollowing();
        
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
    this._following = [];
  }

  async login() {
    if (window.nostr) {
      try {
        // Request public key from extension
        const publicKey = await window.nostr.getPublicKey();
        
        if (publicKey) {
          this._publicKey = publicKey;
          this._privateKey = null; // We don't get the private key from extension
          
          // Load following list
          this.loadFollowing();
          
          return true;
        }
      } catch (error) {
        console.error("Error with NIP-07 extension:", error);
      }
    }
    
    // If no extension or it failed, generate new keys
    if (!this._publicKey) {
      await this.generateNewKeys();
    }
    
    return !!this._publicKey;
  }
  
  async signOut() {
    this.clearKeys();
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
    const subId = this.subscribe(
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
          this.unsubscribe(subId);
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
  ): string {
    const sub = this.batchSubscribe(filters, callback);
    return sub.id;
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
          id: `sub_${Math.random().toString(36).substring(2, 15)}`, // Generate a random ID
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

  async publishEvent(event: any): Promise<string | null> {
    if (!this._privateKey && !window.nostr) {
      console.error("No private key or NIP-07 extension available");
      return null;
    }

    try {
      // Create event object with required fields
      const eventToSign = {
        ...event,
        pubkey: this._publicKey!,
        created_at: Math.floor(Date.now() / 1000),
        id: "",
        sig: "",
      };
      
      // Add event ID
      eventToSign.id = getEventHash(eventToSign);
      
      let signedEvent: NostrEvent;
      
      // Try to sign with extension first
      if (window.nostr) {
        try {
          signedEvent = await window.nostr.signEvent(eventToSign);
        } catch (err) {
          console.error("Error signing with extension:", err);
          // Fall back to local signing if we have a private key
          if (this._privateKey) {
            signedEvent = signEvent(eventToSign, this._privateKey);
          } else {
            throw new Error("Failed to sign event");
          }
        }
      } else if (this._privateKey) {
        // Sign with local private key
        signedEvent = signEvent(eventToSign, this._privateKey);
      } else {
        throw new Error("No signing method available");
      }

      if (validateEvent(signedEvent) && verifySignature(signedEvent)) {
        // Get connected relays
        const relays = this.getRelayStatus()
          .filter(relay => relay.status === 'connected')
          .map(relay => relay.url);
        
        if (relays.length === 0) {
          console.error("No connected relays available");
          return null;
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
        const isSuccess = results.some(result => result === true);
        
        return isSuccess ? signedEvent.id : null;
      } else {
        console.error("Invalid signature");
        return null;
      }
    } catch (error) {
      console.error("Error publishing event:", error);
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
  
  getNpubFromHex(hex: string): string {
    try {
      return nip19.npubEncode(hex);
    } catch (error) {
      console.error("Error encoding hex to npub:", error);
      return "";
    }
  }
  
  async publishProfileMetadata(metadata: any): Promise<boolean> {
    if (!this.privateKey && !window.nostr) {
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

      const eventId = await this.publishEvent(event);
      return !!eventId;
    } catch (error) {
      console.error("Error publishing profile metadata:", error);
      return false;
    }
  }
  
  isFollowing(pubkey: string): boolean {
    return this._following.includes(pubkey);
  }
  
  async followUser(pubkey: string): Promise<boolean> {
    if (!this._publicKey) return false;
    
    // Add to following list if not already following
    if (!this._following.includes(pubkey)) {
      this._following = [...this._following, pubkey];
      
      // Save to local storage
      localStorage.setItem(`following_${this._publicKey}`, JSON.stringify(this._following));
      
      // Publish contact list update
      return await this.publishContactList();
    }
    
    return true;
  }
  
  async unfollowUser(pubkey: string): Promise<boolean> {
    if (!this._publicKey) return false;
    
    // Remove from following list
    if (this._following.includes(pubkey)) {
      this._following = this._following.filter(p => p !== pubkey);
      
      // Save to local storage
      localStorage.setItem(`following_${this._publicKey}`, JSON.stringify(this._following));
      
      // Publish contact list update
      return await this.publishContactList();
    }
    
    return true;
  }
  
  private async publishContactList(): Promise<boolean> {
    // Create tags for each followed pubkey
    const tags = this._following.map(pubkey => ['p', pubkey]);
    
    // Add relay tags
    this.relays.forEach(relay => {
      tags.push(['r', relay]);
    });
    
    // Create and publish the contact list event
    const event = {
      kind: 3, // Contact list
      tags: tags,
      content: '',
    };
    
    const eventId = await this.publishEvent(event);
    return !!eventId;
  }
  
  async sendDirectMessage(recipient: string, content: string): Promise<string | null> {
    if (!this._publicKey) return null;
    
    try {
      // Create encrypted DM
      // In a real implementation, this would use NIP-04 encryption
      // For simplicity, I'm using a basic approach
      const event = {
        kind: 4, // Encrypted Direct Message
        tags: [['p', recipient]], // Tag with recipient's pubkey
        content: content // In reality: encrypt(content, shared_secret)
      };
      
      return await this.publishEvent(event);
    } catch (error) {
      console.error("Error sending DM:", error);
      return null;
    }
  }
  
  async createCommunity(data: any): Promise<string | null> {
    // Implement community creation logic (NIP-28)
    const event = {
      kind: 34550, // Community definition
      content: JSON.stringify(data),
      tags: [
        ['d', data.id], // Community ID
        ['name', data.name]
      ]
    };
    
    return await this.publishEvent(event);
  }
  
  async createProposal(communityId: string, data: any): Promise<string | null> {
    // Implement proposal creation logic
    const event = {
      kind: 34551, // Community proposal
      content: JSON.stringify(data),
      tags: [
        ['a', `34550:${this._publicKey}:${communityId}`], // Reference to community
        ['title', data.title]
      ]
    };
    
    return await this.publishEvent(event);
  }
  
  async voteOnProposal(proposalId: string, communityId: string, vote: 'up' | 'down'): Promise<string | null> {
    // Implement voting logic
    const event = {
      kind: 34552, // Community vote
      content: vote,
      tags: [
        ['e', proposalId], // Reference to proposal
        ['a', `34550:${this._publicKey}:${communityId}`], // Reference to community
      ]
    };
    
    return await this.publishEvent(event);
  }
}

// Add NIP-07 extension interface
declare global {
  interface Window {
    nostr?: {
      getPublicKey: () => Promise<string>;
      signEvent: (event: any) => Promise<NostrEvent>;
    };
  }
}

const nostrService = new NostrService();

export { nostrService };
export type { Relay };

