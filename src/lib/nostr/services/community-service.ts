import { SimplePool } from 'nostr-tools';
import { EVENT_KINDS } from '../constants';
import { CommunityManager } from '../community';
import type { ProposalCategory } from '@/types/community';

/**
 * Community Service class for handling community functionality
 * Implements NIP-172 community and proposal standards
 */
export class CommunityService {
  private pool: SimplePool;
  private publicKey: string | null;
  private getPrivateKey: (() => string | null) | null;
  private communityManager: CommunityManager;
  private getConnectedRelayUrls: () => string[];

  constructor(
    communityManager: CommunityManager,
    getConnectedRelayUrls: () => string[],
    pool: SimplePool,
    publicKey: string | null,
    getPrivateKey: (() => string | null) | null
  ) {
    this.communityManager = communityManager;
    this.getConnectedRelayUrls = getConnectedRelayUrls;
    this.pool = pool;
    this.publicKey = publicKey;
    this.getPrivateKey = getPrivateKey;
  }

  /**
   * Create a proposal for a community following NIP-172
   */
  async createProposal(
    communityId: string,
    title: string,
    description: string,
    options: string[],
    category: ProposalCategory = 'other'
  ): Promise<string | null> {
    // Enhanced validation with more detailed error logging
    if (!communityId) {
      console.error("Cannot create proposal: missing communityId");
      throw new Error("Community ID is required to create a proposal");
    }
    
    if (!this.publicKey) {
      console.error("Cannot create proposal: not logged in (missing pubkey)");
      throw new Error("You must be logged in to create a proposal");
    }
    
    console.log("Creating proposal with auth status:", {
      pubkey: this.publicKey ? this.publicKey.slice(0, 8) + '...' : null,
      hasPrivateKeyGetter: !!this.getPrivateKey,
      communityId: communityId.slice(0, 8) + '...'
    });
    
    const relays = this.getConnectedRelayUrls();
    
    // If no relays connected, try connecting to backup relays
    if (relays.length === 0) {
      console.warn("No relays connected, trying backup relays");
      const backupRelays = [
        'wss://relay.damus.io',
        'wss://nos.lol',
        'wss://relay.nostr.band'
      ];
      
      await this.connectToBackupRelays(backupRelays);
    }
    
    console.log("Creating proposal on relays:", this.getConnectedRelayUrls());
    
    // Default end time is 7 days from now if not specified per NIP-172
    const endTime = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
    
    // Create proposal data according to NIP-172
    const proposalData = {
      title,
      description,
      options,
      category,
      createdAt: Math.floor(Date.now() / 1000),
      endsAt: endTime,
      minQuorum: 0 // Default 0 means no quorum requirement
    };
    
    // Generate unique proposal ID per NIP-172
    const proposalId = `proposal_${Math.random().toString(36).substring(2, 10)}`;
    
    // Create proposal event per NIP-172
    const event = {
      kind: EVENT_KINDS.PROPOSAL,
      content: JSON.stringify(proposalData),
      tags: [
        ["e", communityId], // Reference to community event per NIP-172
        ["d", proposalId] // Unique identifier per NIP-172
      ]
    };
    
    try {
      console.log("Publishing proposal event:", event);
      
      const privateKey = this.getPrivateKey ? this.getPrivateKey() : null;
      
      // Use the publishEvent method from the communityManager
      const eventId = await this.communityManager.publishEvent(
        this.pool,
        this.publicKey,
        privateKey,
        event,
        this.getConnectedRelayUrls()
      );
      
      if (eventId) {
        console.log("Created proposal with ID:", eventId);
        return eventId;
      } else {
        console.error("Failed to create proposal: no event ID returned");
        throw new Error("Failed to publish proposal to relays");
      }
    } catch (error) {
      console.error("Error creating proposal:", error);
      throw error;
    }
  }

  /**
   * Create a new community
   */
  async createCommunity(name: string, description: string): Promise<string | null> {
    if (!this.publicKey) {
      console.error("Cannot create community: not logged in");
      throw new Error("You must be logged in to create a community");
    }
    
    console.log("Creating community with auth status:", {
      pubkey: this.publicKey ? this.publicKey.slice(0, 8) + '...' : null,
      hasPrivateKeyGetter: !!this.getPrivateKey
    });
    
    const relays = this.getConnectedRelayUrls();
    
    // If no relays connected, try connecting to backup relays
    if (relays.length === 0) {
      console.warn("No relays connected, trying backup relays");
      const backupRelays = [
        'wss://relay.damus.io',
        'wss://nos.lol',
        'wss://relay.nostr.band'
      ];
      
      await this.connectToBackupRelays(backupRelays);
    }
    
    // Create community event according to NIP-172
    const event = {
      kind: EVENT_KINDS.COMMUNITY,
      content: JSON.stringify({ name, description }),
      tags: [
        ["d", `community_${Math.random().toString(36).substring(2, 10)}`]
      ]
    };
    
    try {
      console.log("Publishing community event to relays:", this.getConnectedRelayUrls());
      
      const privateKey = this.getPrivateKey ? this.getPrivateKey() : null;
      
      if (!privateKey && !window.nostr) {
        console.error("No private key or nostr extension available");
        throw new Error("Unable to sign the event. Please check your login or extension.");
      }
      
      const eventId = await this.communityManager.publishEvent(
        this.pool,
        this.publicKey,
        privateKey,
        event,
        this.getConnectedRelayUrls()
      );
      
      if (!eventId) {
        throw new Error("Failed to publish community to relays");
      }
      
      return eventId;
    } catch (error) {
      console.error("Error creating community:", error);
      throw error;
    }
  }

  /**
   * Fetch community details by ID
   */
  async fetchCommunity(communityId: string): Promise<any> {
    try {
      // Implementation of fetching community details
      const relays = this.getConnectedRelayUrls();
      
      // Actual implementation would go here
      // This is a placeholder
      
      return { id: communityId, name: "Community", members: [] };
    } catch (error) {
      console.error("Error fetching community:", error);
      return null;
    }
  }

  /**
   * Vote on a proposal following NIP-172
   */
  async voteOnProposal(proposalId: string, optionIndex: number): Promise<string | null> {
    if (!this.publicKey) {
      console.error("Cannot vote on proposal: not logged in");
      return null;
    }
    
    // Create vote event according to NIP-172
    const event = {
      kind: EVENT_KINDS.VOTE,
      content: JSON.stringify({ option: optionIndex }),
      tags: [
        ["e", proposalId]
      ]
    };
    
    try {
      const privateKey = this.getPrivateKey ? this.getPrivateKey() : null;
      
      const eventId = await this.communityManager.publishEvent(
        this.pool,
        this.publicKey,
        privateKey,
        event,
        this.getConnectedRelayUrls()
      );
      
      return eventId;
    } catch (error) {
      console.error("Error voting on proposal:", error);
      return null;
    }
  }

  // Helper method to connect to backup relays if needed
  private async connectToBackupRelays(relays: string[]): Promise<void> {
    for (const relay of relays) {
      try {
        await this.pool.ensureRelay(relay);
        console.log(`Connected to backup relay: ${relay}`);
      } catch (err) {
        console.error(`Failed to connect to backup relay ${relay}:`, err);
      }
    }
  }
}
