
import { getEventHash, getPublicKey, nip19, SimplePool, generatePrivateKey, finalizeEvent } from 'nostr-tools';
import { toast } from "sonner";

export interface NostrEvent {
  id?: string;
  pubkey?: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig?: string;
}

export interface Relay {
  url: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  read: boolean;
  write: boolean;
}

// Event types based on Nostr Kinds
export const EVENT_KINDS = {
  META: 0,            // Profile metadata
  TEXT_NOTE: 1,       // Standard note/post
  RECOMMEND_RELAY: 2, // Relay recommendations
  CONTACTS: 3,        // Following list
  DIRECT_MESSAGE: 4,  // Encrypted direct messages
  REACTION: 7,        // Reactions to notes
};

class NostrService {
  private relays: Map<string, WebSocket> = new Map();
  private defaultRelays: string[] = [
    'wss://relay.damus.io',
    'wss://relay.nostr.band',
    'wss://nostr.bitcoiner.social'
  ];
  
  private subscriptions: Map<string, Set<(event: NostrEvent) => void>> = new Map();
  private _publicKey: string | null = null;
  private _privateKey: string | null = null;
  private pubkeyHandles: Map<string, string> = new Map();
  private pool: SimplePool | null = null;
  
  constructor() {
    // Try to restore from localStorage
    this.loadUserKeys();
    this.pool = new SimplePool();
  }
  
  // User authentication and keys
  public get publicKey(): string | null {
    return this._publicKey;
  }
  
  public loadUserKeys(): void {
    const savedPubkey = localStorage.getItem('nostr_pubkey');
    if (savedPubkey) {
      this._publicKey = savedPubkey;
    }
    
    const savedPrivkey = localStorage.getItem('nostr_privkey');
    if (savedPrivkey) {
      this._privateKey = savedPrivkey;
    }
  }
  
  public async login(): Promise<boolean> {
    try {
      // Try NIP-07 browser extension
      if (window.nostr) {
        try {
          const pubkey = await window.nostr.getPublicKey();
          if (pubkey) {
            this._publicKey = pubkey;
            localStorage.setItem('nostr_pubkey', pubkey);
            toast.success("Successfully connected with extension");
            return true;
          }
        } catch (err) {
          console.error("Failed to get public key from extension:", err);
          toast.error("Failed to connect with Nostr extension");
        }
      } else {
        toast.error("No Nostr extension found. Please install one (like nos2x or Alby)");
      }
      
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  }
  
  public async signOut(): Promise<void> {
    this._publicKey = null;
    this._privateKey = null;
    localStorage.removeItem('nostr_pubkey');
    localStorage.removeItem('nostr_privkey');
    
    // Disconnect from all relays
    this.relays.forEach(socket => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    });
    this.relays.clear();
  }
  
  // Relay management
  public async connectToRelay(relayUrl: string): Promise<boolean> {
    if (this.relays.has(relayUrl)) {
      return true; // Already connected
    }
    
    try {
      const socket = new WebSocket(relayUrl);
      
      return new Promise((resolve) => {
        socket.onopen = () => {
          this.relays.set(relayUrl, socket);
          resolve(true);
        };
        
        socket.onerror = () => {
          resolve(false);
        };
        
        socket.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            // Handle different types of messages from the relay
            if (data[0] === 'EVENT' && data[1]) {
              const subId = data[1];
              const event = data[2];
              
              const callbacks = this.subscriptions.get(subId);
              if (callbacks) {
                callbacks.forEach(cb => cb(event));
              }
            }
          } catch (e) {
            console.error('Error parsing relay message:', e);
          }
        };
      });
    } catch (error) {
      console.error(`Failed to connect to relay ${relayUrl}:`, error);
      return false;
    }
  }
  
  public async connectToDefaultRelays(): Promise<void> {
    const promises = this.defaultRelays.map(url => this.connectToRelay(url));
    await Promise.all(promises);
  }
  
  public async publishEvent(event: Partial<NostrEvent>): Promise<string | null> {
    if (!this._publicKey) {
      toast.error("You must be logged in to publish");
      return null;
    }
    
    const fullEvent: NostrEvent = {
      pubkey: this._publicKey,
      created_at: Math.floor(Date.now() / 1000),
      kind: event.kind || EVENT_KINDS.TEXT_NOTE,
      tags: event.tags || [],
      content: event.content || '',
    };
    
    const eventId = getEventHash(fullEvent as any);
    let signedEvent: NostrEvent;
    
    try {
      if (window.nostr) {
        // Use NIP-07 browser extension for signing
        signedEvent = await window.nostr.signEvent(fullEvent);
      } else if (this._privateKey) {
        // Use private key if available (not recommended for production)
        signedEvent = finalizeEvent(
          {
            kind: fullEvent.kind,
            created_at: fullEvent.created_at,
            tags: fullEvent.tags,
            content: fullEvent.content,
          },
          this._privateKey
        );
      } else {
        toast.error("No signing method available");
        return null;
      }
      
      // Publish to all connected relays
      let publishedCount = 0;
      for (const [url, socket] of this.relays.entries()) {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify(["EVENT", signedEvent]));
          publishedCount++;
        }
      }
      
      if (publishedCount === 0) {
        toast.error("Not connected to any relays");
        return null;
      }
      
      return eventId;
    } catch (error) {
      console.error("Error publishing event:", error);
      toast.error("Failed to publish event");
      return null;
    }
  }
  
  // Subscribe to events
  public subscribe(
    filters: { kinds?: number[], authors?: string[], since?: number, limit?: number, ids?: string[] }[],
    onEvent: (event: NostrEvent) => void
  ): string {
    const subId = `sub_${Math.random().toString(36).substr(2, 9)}`;
    
    this.subscriptions.set(subId, new Set([onEvent]));
    
    // Send subscription request to all connected relays
    for (const [_, socket] of this.relays.entries()) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(["REQ", subId, ...filters]));
      }
    }
    
    return subId;
  }
  
  public unsubscribe(subId: string): void {
    this.subscriptions.delete(subId);
    
    // Send unsubscribe request to all connected relays
    for (const [_, socket] of this.relays.entries()) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(["CLOSE", subId]));
      }
    }
  }
  
  // Utility methods
  public formatPubkey(pubkey: string, format: 'hex' | 'npub' = 'npub'): string {
    if (!pubkey) return '';
    
    try {
      if (format === 'npub' && pubkey.length === 64) {
        return nip19.npubEncode(pubkey);
      } else if (format === 'hex' && pubkey.startsWith('npub1')) {
        const { data } = nip19.decode(pubkey);
        return data as string;
      }
    } catch (e) {
      console.error('Error formatting pubkey:', e);
    }
    
    return pubkey;
  }
  
  public getRelayStatus(): Relay[] {
    return Array.from(this.relays.entries()).map(([url, socket]) => {
      let status: Relay['status'];
      switch (socket.readyState) {
        case WebSocket.CONNECTING:
          status = 'connecting';
          break;
        case WebSocket.OPEN:
          status = 'connected';
          break;
        case WebSocket.CLOSED:
          status = 'disconnected';
          break;
        default:
          status = 'error';
      }
      
      return {
        url,
        status,
        read: true,
        write: true
      };
    });
  }
  
  public getNpubFromHex(hex: string): string {
    try {
      return nip19.npubEncode(hex);
    } catch (e) {
      console.error('Error encoding pubkey:', e);
      return hex;
    }
  }
  
  public getHexFromNpub(npub: string): string {
    try {
      const { data } = nip19.decode(npub);
      return data as string;
    } catch (e) {
      console.error('Error decoding npub:', e);
      return npub;
    }
  }
}

// Create singleton instance
export const nostrService = new NostrService();

// Add typings for the NIP-07 window extension
declare global {
  interface Window {
    nostr?: {
      getPublicKey(): Promise<string>;
      signEvent(event: object): Promise<NostrEvent>;
      nip04?: {
        encrypt(pubkey: string, plaintext: string): Promise<string>;
        decrypt(pubkey: string, ciphertext: string): Promise<string>;
      };
    };
  }
}
