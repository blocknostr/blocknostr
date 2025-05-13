import { SimplePool, Event as NostrEvent, getPublicKey, nip19, nip04 } from 'nostr-tools';
import { SocialInteractionService } from './services/social-interaction-service';

export class NostrService {
  private _pool: SimplePool;
  private _publicKey: string | null = null;
  private _privateKey: string | null = null;
  private _relays: { [url: string]: { status: 'connected' | 'connecting' | 'disconnected', sub?: any } } = {};
  private _eventListeners: { [subId: string]: (event: any) => void } = {};
  private _defaultRelays: string[] = [
    'wss://relay.damus.io',
    'wss://relay.nostr.band'
  ];
  
  // Add social interaction service
  public socialInteractionService: SocialInteractionService;

  constructor() {
    this._pool = new SimplePool();
    this.loadKeysFromLocalStorage();
    this.initializeRelays();
    
    // Initialize social interaction service with proper context
    this.socialInteractionService = new SocialInteractionService(
      this._pool,
      () => this._publicKey,
      () => this.getConnectedRelayUrls()
    );
  }
  
  /**
   * Load keys from local storage
   */
  loadKeysFromLocalStorage() {
    const pubkey = localStorage.getItem('pubkey');
    const privkey = localStorage.getItem('privkey');
    
    if (pubkey) {
      try {
        this._publicKey = pubkey;
      } catch (error) {
        console.error("Error parsing pubkey from local storage:", error);
        this._publicKey = null;
      }
    }
    
    if (privkey) {
      try {
        this._privateKey = privkey;
      } catch (error) {
        console.error("Error parsing privkey from local storage:", error);
        this._privateKey = null;
      }
    }
  }
  
  /**
   * Save keys to local storage
   */
  saveKeysToLocalStorage(pubkey: string, privkey: string) {
    localStorage.setItem('pubkey', pubkey);
    localStorage.setItem('privkey', privkey);
    
    this._publicKey = pubkey;
    this._privateKey = privkey;
  }
  
  /**
   * Clear keys from local storage
   */
  clearKeysFromLocalStorage() {
    localStorage.removeItem('pubkey');
    localStorage.removeItem('privkey');
    
    this._publicKey = null;
    this._privateKey = null;
  }
  
  /**
   * Initialize relays
   */
  initializeRelays() {
    // Load relays from local storage
    const relays = localStorage.getItem('relays');
    if (relays) {
      try {
        const relayUrls = JSON.parse(relays) as string[];
        relayUrls.forEach(url => this.addRelay(url));
      } catch (error) {
        console.error("Error parsing relays from local storage:", error);
        this._defaultRelays.forEach(url => this.addRelay(url));
      }
    } else {
      this._defaultRelays.forEach(url => this.addRelay(url));
    }
  }
  
  /**
   * Connect to user relays
   */
  async connectToUserRelays(): Promise<void> {
    const relayUrls = Object.keys(this._relays);
    
    if (relayUrls.length === 0) {
      console.warn("No relays to connect to. Add relays first.");
      return;
    }
    
    relayUrls.forEach(url => {
      if (this._relays[url].status !== 'connected') {
        this.connectRelay(url);
      }
    });
  }
  
  /**
   * Add a relay
   */
  async addRelay(url: string): Promise<boolean> {
    if (this._relays[url]) {
      console.log(`Relay ${url} already exists.`);
      return false;
    }
    
    this._relays[url] = { status: 'disconnected' };
    
    // Save relays to local storage
    localStorage.setItem('relays', JSON.stringify(Object.keys(this._relays)));
    
    return this.connectRelay(url);
  }
  
  /**
   * Connect to a relay
   */
  async connectRelay(url: string): Promise<boolean> {
    if (!this._pool) {
      console.error("Pool is not initialized.");
      return false;
    }
    
    if (this._relays[url].status === 'connected' || this._relays[url].status === 'connecting') {
      console.log(`Already connecting/connected to ${url}`);
      return true;
    }
    
    this._relays[url] = { status: 'connecting' };
    
    return new Promise((resolve) => {
      this._pool.ensureRelay(url).then(relay => {
        relay.on('connect', () => {
          console.log(`Connected to relay: ${url}`);
          this._relays[url] = { status: 'connected' };
          resolve(true);
        });
        
        relay.on('disconnect', () => {
          console.log(`Disconnected from relay: ${url}`);
          this._relays[url] = { status: 'disconnected' };
          resolve(false);
        });
        
        relay.on('error', () => {
          console.error(`Error connecting to relay: ${url}`);
          this._relays[url] = { status: 'disconnected' };
          resolve(false);
        });
      }).catch(error => {
        console.error(`Error ensuring relay ${url}:`, error);
        this._relays[url] = { status: 'disconnected' };
        resolve(false);
      });
    });
  }
  
  /**
   * Remove a relay
   */
  removeRelay(url: string): void {
    if (this._relays[url]) {
      delete this._relays[url];
      
      // Save relays to local storage
      localStorage.setItem('relays', JSON.stringify(Object.keys(this._relays)));
      
      console.log(`Relay ${url} removed.`);
    } else {
      console.log(`Relay ${url} not found.`);
    }
  }
  
  /**
   * Get relay status
   */
  getRelayStatus(): { url: string; status: string }[] {
    return Object.entries(this._relays).map(([url, status]) => ({
      url,
      status: status.status
    }));
  }
  
  /**
   * Publish an event
   */
  async publishEvent(event: any): Promise<string | null> {
    if (!this._privateKey) {
      console.error("Private key not set.");
      return null;
    }
    
    if (!this._pool) {
      console.error("Pool is not initialized.");
      return null;
    }
    
    const pubkey = getPublicKey(this._privateKey);
    
    const eventTemplate = {
      kind: event.kind,
      pubkey: pubkey,
      created_at: Math.floor(Date.now() / 1000),
      tags: event.tags || [],
      content: event.content || ""
    };
    
    const signedEvent = {
      ...eventTemplate,
      id: '',
      sig: ''
    };
    
    try {
      const signed = await nip04.signEvent(signedEvent, this._privateKey);
      
      return new Promise((resolve, reject) => {
        let pubs = 0;
        
        Object.keys(this._relays).forEach(relayUrl => {
          if (this._relays[relayUrl].status === 'connected') {
            pubs++;
            const relay = this._pool.getRelay(relayUrl);
            
            if (relay) {
              relay.publish(signed).then(() => {
                console.log(`Event published to ${relayUrl}`);
                pubs--;
                if (pubs === 0) {
                  resolve(signed.id);
                }
              }).catch(err => {
                console.error(`Failed to publish to ${relayUrl}:`, err);
                pubs--;
                if (pubs === 0) {
                  reject(new Error(`Failed to publish to one or more relays: ${err}`));
                }
              });
            } else {
              console.warn(`Relay ${relayUrl} not found in pool.`);
              pubs--;
              if (pubs === 0) {
                reject(new Error(`Relay ${relayUrl} not found in pool.`));
              }
            }
          }
        });
        
        if (pubs === 0) {
          reject(new Error("No connected relays."));
        }
      });
    } catch (error) {
      console.error("Error signing event:", error);
      return null;
    }
  }
  
  /**
   * Subscribe to events
   */
  subscribe(filters: any[], callback: (event: any) => void): string {
    if (!this._pool) {
      console.error("Pool is not initialized.");
      return '';
    }
    
    const sub = this._pool.sub(
      Object.keys(this._relays),
      filters
    );
    
    const subId = `sub_${Math.random().toString(36).substring(2, 15)}`;
    this._eventListeners[subId] = callback;
    
    sub.on('event', (event: NostrEvent) => {
      if (this._eventListeners[subId]) {
        this._eventListeners[subId](event);
      }
    });
    
    sub.on('eose', () => {
      console.log('EOSE: Subscription completed.');
    });
    
    return subId;
  }
  
  /**
   * Unsubscribe from events
   */
  unsubscribe(subId: string): void {
    if (this._pool) {
      this._pool.unsub(subId);
      delete this._eventListeners[subId];
      console.log(`Unsubscribed from ${subId}`);
    }
  }
  
  /**
   * Get event by id
   */
  async getEventById(id: string): Promise<NostrEvent | null> {
    if (!this._pool) {
      console.error("Pool is not initialized.");
      return null;
    }
    
    try {
      const event = await this._pool.get(Object.keys(this._relays), { ids: [id] }) as NostrEvent;
      return event || null;
    } catch (error) {
      console.error("Error fetching event by id:", error);
      return null;
    }
  }
  
  /**
   * Set public key
   */
  setPublicKey(pubkey: string): void {
    this._publicKey = pubkey;
  }
  
  /**
   * Get public key
   */
  get publicKey(): string | null {
    return this._publicKey;
  }
  
  /**
   * Set private key
   */
  setPrivateKey(privkey: string): void {
    this._privateKey = privkey;
  }
  
  /**
   * Get private key
   */
  get privateKey(): string | null {
    return this._privateKey;
  }
  
  /**
   * Format public key
   */
  formatPubkey(pubkey: string): string {
    try {
      return nip19.npubEncode(pubkey);
    } catch (error) {
      console.error("Error formatting pubkey:", error);
      return pubkey;
    }
  }
}
