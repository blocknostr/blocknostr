import { getEventHash, getPublicKey, nip19, SimplePool } from 'nostr-tools';
import { toast } from "sonner";
// Use explicit type imports to fix the isolatedModules error
import type { NostrEvent, Relay, SubCloser } from './nostr/types';

// Re-export types with the correct syntax for isolatedModules
export type { NostrEvent, Relay, SubCloser };

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
  private _userRelays: Map<string, {read: boolean; write: boolean}> = new Map(); // Updated to NIP-65 format
  
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
  
  public get userRelays(): Map<string, {read: boolean; write: boolean}> {
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
        // Convert to Map with read/write properties per NIP-65
        this._userRelays = new Map(
          Object.entries(relaysObject).map(([url, value]) => {
            // Handle both old format (boolean) and new format (object with read/write)
            if (typeof value === 'boolean') {
              return [url, { read: true, write: value }];
            } else {
              return [url, value as {read: boolean; write: boolean}];
            }
          })
        );
      } catch (e) {
        console.error('Error loading user relays:', e);
      }
    } else {
      // Default to the app's default relays
      this.defaultRelays.forEach(relay => {
        this._userRelays.set(relay, { read: true, write: true }); // Read/write by default
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
      
      // Fix: Store the subscription as an opaque SubCloser object, not as a string ID
      const subCloser = this.subscribe(
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
        this.unsubscribe(subCloser);
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
  
  public async addRelay(relayUrl: string, readWrite: {read: boolean; write: boolean} = {read: true, write: true}): Promise<boolean> {
    // Validate URL format
    try {
      new URL(relayUrl);
    } catch (e) {
      toast.error("Invalid relay URL");
      return false;
    }
    
    // Add to user relays with NIP-65 format
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
  
  public updateRelayPermissions(relayUrl: string, permissions: {read: boolean; write: boolean}): boolean {
    if (!this._userRelays.has(relayUrl)) {
      return false;
    }
    
    this._userRelays.set(relayUrl, permissions);
    this.saveUserRelays();
    
    // Publish updated relay list
    this.publishRelayList();
    return true;
  }
  
  private saveUserRelays(): void {
    const relaysObject = Object.fromEntries(this._userRelays);
    localStorage.setItem('nostr_user_relays', JSON.stringify(relaysObject));
  }
  
  private async publishRelayList(): Promise<string | null> {
    if (!this._publicKey) return null;
    
    // Create relay list tags in NIP-65 format
    const relayList = Array.from(this._userRelays.entries()).map(
      ([url, {read, write}]) => {
        const permission = [];
        if (read) permission.push('read');
        if (write) permission.push('write');
        return ['r', url, permission.join(' ')];
      }
    );
    
    // Create and publish the NIP-65 event (kind 10002)
    const event = {
      kind: 10002, // NIP-65 relay list kind
      content: '',
      tags: relayList
    };
    
    return await this.publishEvent(event);
  }
  
  // Method to add multiple relays at once with NIP-65 format
  public async addMultipleRelays(relays: {url: string, read: boolean, write: boolean}[]): Promise<number> {
    if (!relays.length) return 0;
    
    let successCount = 0;
    
    for (const relay of relays) {
      try {
        const success = await this.addRelay(relay.url, {read: relay.read, write: relay.write});
        if (success) successCount++;
      } catch (error) {
        console.error(`Failed to add relay ${relay.url}:`, error);
      }
    }
    
    return successCount;
  }
  
  // Method to get relays for a user following NIP-65 standard
  public async getRelaysForUser(pubkey: string): Promise<{url: string, read: boolean, write: boolean}[]> {
    if (!this.pool) return [];
    
    return new Promise((resolve) => {
      const relays: {url: string, read: boolean, write: boolean}[] = [];
      
      // Subscribe to NIP-65 relay list event (kind 10002)
      // Use the correct subscription method as per NIP-01
      const filters = [
        {
          kinds: [10002], // NIP-65 relay list kind
          authors: [pubkey],
          limit: 1
        }
      ];
      
      // Get relay URLs to connect to
      const relayUrls = Array.from(this.relays.keys()).length > 0 
        ? Array.from(this.relays.keys()) 
        : this.defaultRelays;
      
      if (relayUrls.length === 0) {
        resolve([]);
        return;
      }
      
      // Use the SimplePool for subscription
      const sub = this.pool.subscribeMany(
        relayUrls,
        filters,
        {
          onevent: (event) => {
            try {
              // Parse the relay list from tags
              const relayTags = event.tags.filter(tag => tag[0] === 'r' && tag.length >= 2);
              
              relayTags.forEach(tag => {
                if (tag[1] && typeof tag[1] === 'string') {
                  let read = true;
                  let write = true;
                  
                  // Check if read/write permissions specified in tag
                  if (tag.length >= 3 && typeof tag[2] === 'string') {
                    const relayPermission = tag[2].toLowerCase();
                    read = relayPermission.includes('read');
                    write = relayPermission.includes('write');
                  }
                  
                  relays.push({ url: tag[1], read, write });
                }
              });
            } catch (error) {
              console.error("Error parsing relay list:", error);
            }
          }
        }
      );
      
      // Set a timeout to resolve with found relays
      setTimeout(() => {
        if (this.pool) {
          this.pool.close([sub]);
        }
        
        // If no relays found via NIP-65, try the older kind (10001)
        if (relays.length === 0) {
          this.fetchLegacyRelayList(pubkey).then(legacyRelays => {
            resolve(legacyRelays);
          });
        } else {
          resolve(relays);
        }
      }, 3000);
    });
  }

  // Fallback method to fetch relays from older format
  private async fetchLegacyRelayList(pubkey: string): Promise<{url: string, read: boolean, write: boolean}[]> {
    if (!this.pool) return [];
    
    return new Promise((resolve) => {
      const relays: {url: string, read: boolean, write: boolean}[] = [];
      
      // Subscribe to the older relay list event kind
      const filters = [
        {
          kinds: [10001], // Older kind for relay list
          authors: [pubkey],
          limit: 1
        }
      ];
      
      // Get relay URLs to connect to
      const relayUrls = Array.from(this.relays.keys()).length > 0 
        ? Array.from(this.relays.keys()) 
        : this.defaultRelays;
      
      if (relayUrls.length === 0) {
        resolve([]);
        return;
      }
      
      // Use the SimplePool for subscription
      const sub = this.pool.subscribeMany(
        relayUrls,
        filters,
        {
          onevent: (event) => {
            // Extract relay URLs from r tags
            const relayTags = event.tags.filter(tag => tag[0] === 'r' && tag.length >= 2);
            relayTags.forEach(tag => {
              if (tag[1] && typeof tag[1] === 'string') {
                let read = true;
                let write = true;
                
                // Check for permissions in third position
                if (tag.length >= 3 && typeof tag[2] === 'string') {
                  read = tag[2].includes('read');
                  write = tag[2].includes('write');
                }
                
                relays.push({ url: tag[1], read, write });
              }
            });
          }
        }
      );
      
      // Set a timeout to resolve with found relays
      setTimeout(() => {
        if (this.pool) {
          this.pool.close([sub]);
        }
        resolve(relays);
      }, 3000);
    });
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
  
  // Subscription management - Updated to handle SubCloser return type
  public subscribe(
    filters: { kinds?: number[], authors?: string[], since?: number, limit?: number, ids?: string[], '#p'?: string[], '#e'?: string[] }[],
    onEvent: (event: NostrEvent) => void
  ): SubCloser {
    const subId = `sub_${Math.random().toString(36).substr(2, 9)}`;
    
    this.subscriptions.set(subId, new Set([onEvent]));
    
    // Send subscription request to all connected relays
    for (const [_, socket] of this.relays.entries()) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(["REQ", subId, ...filters]));
      }
    }
    
    // Return a function that will unsubscribe when called
    return () => {
      this.unsubscribe(subId);
    };
  }
  
  public unsubscribe(subHandle: SubCloser | string): void {
    // If it's a function (SubCloser), execute it to close
    if (typeof subHandle === 'function') {
      subHandle();
      return;
    }
    
    // Otherwise, it's a string ID
    const subId = subHandle;
    this.subscriptions.delete(subId);
    
    // Send unsubscribe request to all connected relays
    for (const [_, socket] of this.relays.entries()) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(["CLOSE", subId]));
      }
    }
  }
  
  // Messaging with NIP-17
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
        kind: EVENT_KINDS.ENCRYPTED_DM, // Using kind 14 (NIP-17)
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
  
  // Publish profile metadata
  public async publishProfileMetadata(metadata: Record<string, any>): Promise<boolean> {
    if (!this._publicKey) {
      toast.error("You must be logged in to update your profile");
      return false;
    }
    
    try {
      const event = {
        kind: EVENT_KINDS.META,
        content: JSON.stringify(metadata),
        tags: []
      };
      
      const eventId = await this.publishEvent(event);
      return !!eventId;
    } catch (error) {
      console.error("Error publishing profile metadata:", error);
      return false;
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
    // First get all relays from userRelays
    const relayMap = new Map<string, Relay>();
    
    // Add all user relays first (even if not connected)
    Array.from(this._userRelays.entries()).forEach(([url, permissions]) => {
      const isConnected = this.relays.has(url) && this.relays.get(url)?.readyState === WebSocket.OPEN;
      const isConnecting = this.relays.has(url) && this.relays.get(url)?.readyState === WebSocket.CONNECTING;
      
      relayMap.set(url, {
        url,
        status: isConnected ? 'connected' : (isConnecting ? 'connecting' : 'disconnected'),
        read: permissions.read,
        write: permissions.write
      });
    });
    
    // Add any connected relays that might not be in userRelays yet
    Array.from(this.relays.entries()).forEach(([url, socket]) => {
      if (!relayMap.has(url)) {
        let status: Relay['status'];
        switch (socket.readyState) {
          case WebSocket.CONNECTING:
            status = 'connecting';
            break;
          case WebSocket.OPEN:
            status = 'connected';
            break;
          default:
            status = 'disconnected';
        }
        
        relayMap.set(url, {
          url,
          status,
          read: true,
          write: true
        });
      }
    });
    
    return Array.from(relayMap.values());
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
  
  // Add the missing getUserProfile method
  public async getUserProfile(pubkey: string): Promise<{
    name?: string;
    displayName?: string;
    picture?: string;
    nip05?: string;
    about?: string;
    banner?: string;
    website?: string;
    lud16?: string;
    [key: string]: any;
  } | null> {
    if (!pubkey) return null;
    
    try {
      await this.connectToUserRelays();
      
      return new Promise((resolve) => {
        const subHandle = this.subscribe(
          [
            {
              kinds: [EVENT_KINDS.META],
              authors: [pubkey],
              limit: 1
            }
          ],
          (event) => {
            try {
              const profile = JSON.parse(event.content);
              
              // Convert to camelCase if needed
              const formattedProfile = {
                ...profile,
                displayName: profile.display_name || profile.displayName || undefined,
              };
              
              resolve(formattedProfile);
              
              // Cleanup subscription after receiving the profile
              setTimeout(() => {
                this.unsubscribe(subHandle);
              }, 100);
            } catch (e) {
              console.error("Error parsing profile:", e);
              resolve(null);
            }
          }
        );
        
        // Set a timeout to resolve with null if no profile is found
        setTimeout(() => {
          this.unsubscribe(subHandle);
          resolve(null);
        }, 5000);
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }
  
  // Add the verifyNip05 method
  public async verifyNip05(identifier: string, pubkey: string): Promise<boolean> {
    try {
      if (!identifier || !identifier.includes('@')) {
        return false;
      }
  
      const [name, domain] = identifier.split('@');
      if (!name || !domain) {
        return false;
      }
  
      // Fetch from /.well-known/nostr.json
      const url = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`;
      
      // Fetch the data
      const response = await fetch(url);
      if (!response.ok) {
        return false;
      }
  
      // Parse the JSON response
      const data = await response.json();
      
      // NIP-05 specifies that the JSON should contain a "names" object
      // with usernames as keys and pubkeys as values
      if (!data.names || !data.names[name]) {
        return false;
      }
  
      // Check if the resolved pubkey matches the expected pubkey
      return data.names[name] === pubkey;
    } catch (error) {
      console.error('Error verifying NIP-05 identifier:', error);
      return false;
    }
  }
  
  // Add fetchNip05Data method
  public async fetchNip05Data(identifier: string): Promise<{
    relays?: Record<string, { read: boolean; write: boolean }>;
    [key: string]: any;
  } | null> {
    try {
      if (!identifier || !identifier.includes('@')) {
        return null;
      }
  
      const [name, domain] = identifier.split('@');
      if (!name || !domain) {
        return null;
      }
  
      // Fetch from /.well-known/nostr.json
      const url = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`;
      
      // Fetch the data
      const response = await fetch(url);
      if (!response.ok) {
        return null;
      }
  
      // Parse the JSON response
      const data = await response.json();
      
      // If we have relays data for this user, return it
      const result: { relays?: Record<string, { read: boolean; write: boolean }> } = {};
      
      if (data.names && data.names[name] && data.relays && data.relays[data.names[name]]) {
        result.relays = {};
        
        // Format relays data according to our internal format
        for (const relay of data.relays[data.names[name]]) {
          result.relays[relay] = { read: true, write: true };
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching NIP-05 data:', error);
      return null;
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
