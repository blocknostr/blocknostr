
import { SimplePool } from 'nostr-tools';

/**
 * Service for handling NIP-11 relay information
 * Implements NIP-11 (Relay Information Document)
 */
export class RelayInfoService {
  private pool: SimplePool;
  private relayInfoCache: Map<string, RelayInfo> = new Map();
  
  constructor(pool: SimplePool) {
    this.pool = pool;
  }
  
  /**
   * Fetch relay information document from a relay
   * @param relayUrl URL of the relay
   * @returns Promise resolving to relay information or null if unavailable
   */
  public async getRelayInfo(relayUrl: string): Promise<RelayInfo | null> {
    // Check cache first
    if (this.relayInfoCache.has(relayUrl)) {
      return this.relayInfoCache.get(relayUrl) || null;
    }
    
    try {
      // Remove trailing slash if present
      const normalizedUrl = relayUrl.endsWith('/') ? relayUrl.slice(0, -1) : relayUrl;
      
      // Prepare the HTTP request to the relay's info endpoint
      const headers = new Headers({
        'Accept': 'application/nostr+json'
      });
      
      // Fetch the relay information document
      const response = await fetch(normalizedUrl, { headers });
      
      if (!response.ok) {
        console.warn(`Failed to fetch NIP-11 information from ${relayUrl}: ${response.status}`);
        return null;
      }
      
      const relayInfo = await response.json();
      
      // Validate the relay info has the required fields
      if (!this.isValidRelayInfo(relayInfo)) {
        console.warn(`Invalid NIP-11 information from ${relayUrl}`);
        return null;
      }
      
      // Cache the relay info
      this.relayInfoCache.set(relayUrl, relayInfo);
      
      return relayInfo;
    } catch (error) {
      console.error(`Error fetching relay information for ${relayUrl}:`, error);
      return null;
    }
  }
  
  /**
   * Get supported NIPs for a relay
   * @param relayUrl URL of the relay
   * @returns Promise resolving to array of supported NIP numbers
   */
  public async getSupportedNIPs(relayUrl: string): Promise<number[]> {
    const info = await this.getRelayInfo(relayUrl);
    return info?.supported_nips || [];
  }
  
  /**
   * Check if a relay supports a specific NIP
   * @param relayUrl URL of the relay
   * @param nipNumber NIP number to check
   * @returns Promise resolving to boolean indicating support
   */
  public async supportsNIP(relayUrl: string, nipNumber: number): Promise<boolean> {
    const supportedNIPs = await this.getSupportedNIPs(relayUrl);
    return supportedNIPs.includes(nipNumber);
  }
  
  /**
   * Get relay limitations
   * @param relayUrl URL of the relay
   * @returns Promise resolving to relay limitations or null
   */
  public async getRelayLimitations(relayUrl: string): Promise<any | null> {
    const info = await this.getRelayInfo(relayUrl);
    return info?.limitation || null;
  }
  
  /**
   * Check if relay info object is valid
   * @param info Relay info object
   * @returns Boolean indicating if relay info is valid
   */
  private isValidRelayInfo(info: any): boolean {
    // Per NIP-11, only name is required
    return !!info && typeof info.name === 'string';
  }
  
  /**
   * Clear the relay info cache
   */
  public clearCache(): void {
    this.relayInfoCache.clear();
  }
}

/**
 * Interface for NIP-11 relay information document
 */
export interface RelayInfo {
  name: string;
  description?: string;
  pubkey?: string;
  contact?: string;
  supported_nips?: number[];
  software?: string;
  version?: string;
  limitation?: {
    max_message_length?: number;
    max_subscriptions?: number;
    max_filters?: number;
    max_limit?: number;
    max_subid_length?: number;
    min_prefix?: number;
    max_event_tags?: number;
    max_content_length?: number;
    min_pow_difficulty?: number;
    auth_required?: boolean;
    payment_required?: boolean;
  };
  payments_url?: string;
  fees?: {
    admission?: FeeSchedule[];
    publication?: FeeSchedule[];
  };
  icon?: string;
}

/**
 * Fee schedule interface for relay payments
 */
interface FeeSchedule {
  amount: number;
  unit: string;
  kinds?: number[];
  description?: string;
}
