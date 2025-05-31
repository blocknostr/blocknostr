import { nip19, getPublicKey } from 'nostr-tools';
import { toast } from "@/lib/toast";
import { EVENT_KINDS } from './constants';
import { NostrProfileMetadata } from './types';

export class UserManager {
  private _publicKey: string | null = null;
  private _privateKey: string | null = null;
  private _following: Set<string> = new Set();
  private _extensionDetected: boolean = false;
  
  get publicKey(): string | null {
    return this._publicKey;
  }
  
  get following(): string[] {
    return Array.from(this._following);
  }

  get hasExtension(): boolean {
    return this._extensionDetected;
  }
  
  loadUserKeys(): void {
    const savedPubkey = localStorage.getItem('nostr_pubkey');
    if (savedPubkey) {
      this._publicKey = savedPubkey;
    }
    
    const savedPrivkey = localStorage.getItem('nostr_privkey');
    if (savedPrivkey) {
      this._privateKey = savedPrivkey;
    }
    
    // Check for NIP-07 extension
    this._extensionDetected = !!window.nostr;
  }
  
  loadFollowing(): void {
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
  
  saveFollowing(): void {
    if (this._publicKey) {
      localStorage.setItem('nostr_following', JSON.stringify(Array.from(this._following)));
    }
  }
  
  isFollowing(pubkey: string): boolean {
    return this._following.has(pubkey);
  }
  
  async login(): Promise<boolean> {
    try {
      // Try NIP-07 browser extension
      if (window.nostr) {
        try {
          const pubkey = await window.nostr.getPublicKey();
          if (pubkey) {
            this._publicKey = pubkey;
            localStorage.setItem('nostr_pubkey', pubkey);
            
            // Try to get relays from extension if supported (NIP-07 extension)
            try {
              if ('getRelays' in window.nostr && typeof window.nostr.getRelays === 'function') {
                const relays = await window.nostr.getRelays();
                if (relays) {
                  localStorage.setItem('nostr_extension_relays', JSON.stringify(relays));
                }
              }
            } catch (relayError) {
              console.warn("Could not get relays from extension:", relayError);
            }
            
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
  
  signOut(): void {
    this._publicKey = null;
    this._privateKey = null;
    localStorage.removeItem('nostr_pubkey');
    localStorage.removeItem('nostr_privkey');
  }
  
  formatPubkey(pubkey: string, format: 'hex' | 'npub' = 'npub'): string {
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
  
  getNpubFromHex(hex: string): string {
    try {
      return nip19.npubEncode(hex);
    } catch (e) {
      console.error('Error encoding pubkey:', e);
      return hex;
    }
  }
  
  getHexFromNpub(npub: string): string {
    try {
      const { data } = nip19.decode(npub);
      return data as string;
    } catch (e) {
      console.error('Error decoding npub:', e);
      return npub;
    }
  }
  
  // Methods to manage user state - used by NostrService
  setPublicKey(pubkey: string | null): void {
    this._publicKey = pubkey;
    if (pubkey) {
      localStorage.setItem('nostr_pubkey', pubkey);
    }
  }
  
  addFollowing(pubkey: string): void {
    this._following.add(pubkey);
    this.saveFollowing();
  }
  
  removeFollowing(pubkey: string): void {
    this._following.delete(pubkey);
    this.saveFollowing();
  }
  
  setFollowing(following: string[]): void {
    this._following = new Set(following);
    this.saveFollowing();
  }
}

