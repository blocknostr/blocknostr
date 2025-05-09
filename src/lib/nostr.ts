
import { getEventHash, getPublicKey, nip19, SimplePool } from 'nostr-tools';
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
  DIRECT_MESSAGE: 4,  // Encrypted direct messages (legacy)
  REACTION: 7,        // Reactions to notes
  ENCRYPTED_DM: 14,   // NIP-17 Encrypted Direct Messages
  RELAY_LIST: 10050,  // Relay lists
  COMMUNITY: 34550,   // Communities/DAOs
  PROPOSAL: 34551,    // Proposals within communities
  VOTE: 34552,        // Votes on proposals
  COMMENT: 34553,     // Comments on proposals
  KICK_PROPOSAL: 34554, // Proposal to kick a member
  KICK_VOTE: 34555,   // Vote on kick proposal
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
  private _following: Set<string> = new Set();
  private _userRelays: Map<string, boolean> = new Map(); // Map of relay URLs to read/write status
  
  constructor() {
    // Try to restore from localStorage
    this.loadUserKeys();
    this.loadFollowing();
    this.loadUserRelays();
    this.pool = new SimplePool();
  }
  
  // User authentication and keys
  public get publicKey(): string | null {
    return this._publicKey;
  }
  
  public get following(): string[] {
    return Array.from(this._following);
  }
  
  public get userRelays(): Map<string, boolean> {
    return new Map(this._userRelays);
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
  
  private loadFollowing(): void {
    const savedFollowing = localStorage.getItem('nostr_following');
    if (savedFollowing) {
      try {
        const followingArray = JSON.parse(savedFollowing);
        this._following = new Set(followingArray);
      } catch (e) {
        console.error('Error loading following list:', e);
      }
    }
  }
  
  private loadUserRelays(): void {
    const savedRelays = localStorage.getItem('nostr_user_relays');
    if (savedRelays) {
      try {
        const relaysObject = JSON.parse(savedRelays);
        this._userRelays = new Map(Object.entries(relaysObject));
      } catch (e) {
        console.error('Error loading user relays:', e);
      }
    } else {
      // Default to the app's default relays
      this.defaultRelays.forEach(relay => {
        this._userRelays.set(relay, true); // Read/write by default
      });
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
            
            // Load following list from relays
            await this.fetchFollowingList();
            
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
  
  // Following functionality
  public isFollowing(pubkey: string): boolean {
    return this._following.has(pubkey);
  }
  
  public async followUser(pubkey: string): Promise<boolean> {
    if (!this._publicKey) {
      toast.error("You must be logged in to follow users");
      return false;
    }
    
    try {
      // Add to local following set
      this._following.add(pubkey);
      this.saveFollowing();
      
      // Publish updated contacts list
      const event = {
        kind: EVENT_KINDS.CONTACTS,
        content: '',
        tags: Array.from(this._following).map(pk => ['p', pk])
      };
      
      await this.publishEvent(event);
      return true;
    } catch (error) {
      console.error("Error following user:", error);
      return false;
    }
  }
  
  public async unfollowUser(pubkey: string): Promise<boolean> {
    if (!this._publicKey) {
      toast.error("You must be logged in to unfollow users");
      return false;
    }
    
    try {
      // Remove from local following set
      this._following.delete(pubkey);
      this.saveFollowing();
      
      // Publish updated contacts list
      const event = {
        kind: EVENT_KINDS.CONTACTS,
        content: '',
        tags: Array.from(this._following).map(pk => ['p', pk])
      };
      
      await this.publishEvent(event);
      return true;
    } catch (error) {
      console.error("Error unfollowing user:", error);
      return false;
    }
  }
  
  private saveFollowing(): void {
    localStorage.setItem('nostr_following', JSON.stringify(Array.from(this._following)));
  }
  
  private async fetchFollowingList(): Promise<void> {
    if (!this._publicKey) return;
    
    try {
      await this.connectToDefaultRelays();
      
      const subId = this.subscribe(
        [
          {
            kinds: [EVENT_KINDS.CONTACTS],
            authors: [this._publicKey],
            limit: 1
          }
        ],
        (event) => {
          // Extract pubkeys from p tags
          const pubkeys = event.tags
            .filter(tag => tag.length >= 2 && tag[0] === 'p')
            .map(tag => tag[1]);
            
          this._following = new Set(pubkeys);
          this.saveFollowing();
        }
      );
      
      // Cleanup subscription after a short time
      setTimeout(() => {
        this.unsubscribe(subId);
      }, 5000);
    } catch (error) {
      console.error("Error fetching following list:", error);
    }
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
  
  public async connectToUserRelays(): Promise<void> {
    const promises = Array.from(this._userRelays.keys()).map(url => this.connectToRelay(url));
    await Promise.all(promises);
  }
  
  public async addRelay(relayUrl: string, readWrite: boolean = true): Promise<boolean> {
    // Validate URL format
    try {
      new URL(relayUrl);
    } catch (e) {
      toast.error("Invalid relay URL");
      return false;
    }
    
    // Add to user relays
    this._userRelays.set(relayUrl, readWrite);
    this.saveUserRelays();
    
    // Try to connect
    const connected = await this.connectToRelay(relayUrl);
    if (connected) {
      // Publish relay list to network
      await this.publishRelayList();
      return true;
    } else {
      toast.error(`Failed to connect to relay: ${relayUrl}`);
      return false;
    }
  }
  
  public removeRelay(relayUrl: string): void {
    this._userRelays.delete(relayUrl);
    this.saveUserRelays();
    
    // Close connection if exists
    const socket = this.relays.get(relayUrl);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
      this.relays.delete(relayUrl);
    }
    
    // Publish updated relay list
    this.publishRelayList();
  }
  
  private saveUserRelays(): void {
    const relaysObject = Object.fromEntries(this._userRelays);
    localStorage.setItem('nostr_user_relays', JSON.stringify(relaysObject));
  }
  
  private async publishRelayList(): Promise<string | null> {
    if (!this._publicKey) return null;
    
    const relayList = Array.from(this._userRelays.entries()).map(
      ([url, readWrite]) => ['r', url, readWrite ? 'read write' : 'read']
    );
    
    const event = {
      kind: EVENT_KINDS.RELAY_LIST,
      content: '',
      tags: relayList
    };
    
    return await this.publishEvent(event);
  }
  
  // Publish events
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
        // Import the function dynamically to fix the missing export issue
        const { finalizeEvent } = await import('nostr-tools');
        signedEvent = finalizeEvent(
          {
            kind: fullEvent.kind,
            created_at: fullEvent.created_at,
            tags: fullEvent.tags,
            content: fullEvent.content,
          },
          this._privateKey as any // Using type assertion to fix the Uint8Array type issue
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
    filters: { kinds?: number[], authors?: string[], since?: number, limit?: number, ids?: string[], '#p'?: string[], '#e'?: string[] }[],
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
  
  // Messaging
  public async sendDirectMessage(recipientPubkey: string, content: string): Promise<string | null> {
    if (!this._publicKey) {
      toast.error("You must be logged in to send messages");
      return null;
    }
    
    try {
      // Encrypt message using NIP-04 if available through extension
      let encryptedContent = content;
      
      if (window.nostr && window.nostr.nip04) {
        encryptedContent = await window.nostr.nip04.encrypt(recipientPubkey, content);
      } else {
        toast.error("Message encryption not available - install a Nostr extension with NIP-04 support");
        return null;
      }
      
      // Create the direct message event (NIP-17)
      const event = {
        kind: EVENT_KINDS.ENCRYPTED_DM,
        content: encryptedContent,
        tags: [
          ['p', recipientPubkey]
        ]
      };
      
      // Publish to relays
      return await this.publishEvent(event);
    } catch (error) {
      console.error("Error sending direct message:", error);
      toast.error("Failed to send message");
      return null;
    }
  }
  
  // DAO/Community features
  public async createCommunity(name: string, description: string): Promise<string | null> {
    if (!this._publicKey) {
      toast.error("You must be logged in to create a community");
      return null;
    }
    
    try {
      const communityData = {
        name,
        description,
        image: "",
        creator: this._publicKey,
        createdAt: Math.floor(Date.now() / 1000)
      };
      
      // Create community event
      const event = {
        kind: EVENT_KINDS.COMMUNITY,
        content: JSON.stringify(communityData),
        tags: [
          ['d', name.toLowerCase().replace(/\s+/g, '-')], // Use as unique identifier
          ['p', this._publicKey] // Creator is first member
        ]
      };
      
      return await this.publishEvent(event);
    } catch (error) {
      console.error("Error creating community:", error);
      toast.error("Failed to create community");
      return null;
    }
  }
  
  public async createProposal(communityId: string, title: string, description: string, options: string[], endsAt?: number): Promise<string | null> {
    if (!this._publicKey) {
      toast.error("You must be logged in to create a proposal");
      return null;
    }
    
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      const proposalData = {
        title,
        description,
        options,
        createdAt: currentTime,
        endsAt: endsAt || (currentTime + 7 * 24 * 60 * 60) // Use provided endsAt or default to 1 week
      };
      
      // Create proposal event
      const event = {
        kind: EVENT_KINDS.PROPOSAL,
        content: JSON.stringify(proposalData),
        tags: [
          ['e', communityId], // Reference to community
          ['d', `proposal-${Math.random().toString(36).substring(2, 10)}`] // Unique identifier
        ]
      };
      
      return await this.publishEvent(event);
    } catch (error) {
      console.error("Error creating proposal:", error);
      toast.error("Failed to create proposal");
      return null;
    }
  }
  
  public async voteOnProposal(proposalId: string, optionIndex: number): Promise<string | null> {
    if (!this._publicKey) {
      toast.error("You must be logged in to vote");
      return null;
    }
    
    try {
      // Create vote event
      const event = {
        kind: EVENT_KINDS.VOTE,
        content: optionIndex.toString(),
        tags: [
          ['e', proposalId], // Reference to proposal
        ]
      };
      
      return await this.publishEvent(event);
    } catch (error) {
      console.error("Error voting on proposal:", error);
      toast.error("Failed to vote");
      return null;
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
