
import { SimplePool } from 'nostr-tools';
import { NostrEvent } from '../types';
import { EVENT_KINDS } from '../constants';
import type { ProposalCategory } from '@/types/community';

/**
 * Community service to handle community-related operations 
 * Implements NIP-172 compatible methods
 */
export class CommunityService {
  constructor(
    private communityManager: any, 
    private getConnectedRelayUrls: () => string[],
    private pool: SimplePool,
    private publicKey: string | null
  ) {}

  /**
   * Fetch a community by ID
   */
  async fetchCommunity(communityId: string): Promise<any> {
    if (!communityId) return null;
    
    try {
      const connectedRelays = this.getConnectedRelayUrls();
      
      return new Promise((resolve) => {
        const subscribe = (filters: any, onEvent: (event: NostrEvent) => void): string => {
          const subcloser = this.pool.subscribe(connectedRelays, filters, {
            onevent: onEvent
          });
          return subcloser.id || ''; // Make sure we have an ID
        };
        
        const unsubscribe = (subId: string): void => {
          if (this.pool.subscriptions && this.pool.subscriptions.has(subId)) {
            const sub = this.pool.subscriptions.get(subId);
            if (sub) sub.close();
          }
        };
        
        const subId = subscribe(
          {
            kinds: [EVENT_KINDS.COMMUNITY],
            '#d': [communityId],
            limit: 1
          },
          (event) => {
            try {
              const community = JSON.parse(event.content);
              community.id = event.id;
              community.uniqueId = communityId;
              
              // Process members from the tags
              const members = event.tags
                .filter(tag => tag.length >= 2 && tag[0] === 'p')
                .map(tag => tag[1]);
                
              community.members = members;
              
              // Process moderators from the tags
              const moderators = event.tags
                .filter(tag => tag.length >= 3 && tag[0] === 'p' && tag[2] === 'moderator')
                .map(tag => tag[1]);
                
              community.moderators = moderators;
              
              resolve(community);
              
              // Cleanup subscription after receiving the community
              setTimeout(() => {
                unsubscribe(subId);
              }, 100);
            } catch (e) {
              console.error("Error parsing community:", e);
              resolve(null);
            }
          }
        );
        
        // Set a timeout to resolve with null if no community is found
        setTimeout(() => {
          unsubscribe(subId);
          resolve(null);
        }, 5000);
      });
    } catch (error) {
      console.error("Error fetching community:", error);
      return null;
    }
  }

  /**
   * Create a new community
   */
  async createCommunity(
    name: string,
    description: string,
    publicKey: string | null,
    relays: string[]
  ): Promise<string | null> {
    if (!publicKey) return null;
    
    const uniqueId = `community_${Math.random().toString(36).substring(2, 10)}`;
    
    // Create community metadata
    const communityData = {
      name,
      description,
      creator: publicKey,
      createdAt: Math.floor(Date.now() / 1000),
      image: "" // Optional image URL
    };
    
    // Create NIP-172 compatible event
    const event = {
      kind: EVENT_KINDS.COMMUNITY,
      content: JSON.stringify(communityData),
      tags: [
        ["d", uniqueId], // Unique identifier for this community
        ["p", publicKey] // Creator is the first member
      ]
    };
    
    try {
      const eventId = await this.communityManager.publishEvent(
        this.pool,
        publicKey,
        null, // No private key
        event,
        relays
      );
      return uniqueId; // Return the community ID on success
    } catch (error) {
      console.error("Error creating community:", error);
      return null;
    }
  }
  
  /**
   * Create a proposal for a community
   */
  async createProposal(
    communityId: string,
    title: string,
    description: string,
    options: string[],
    publicKey: string | null,
    relays: string[],
    category: string = 'other',
    minQuorum?: number,
    endsAt?: number
  ): Promise<string | null> {
    if (!publicKey || !communityId) return null;
    
    // Default end time is 7 days from now if not specified
    const endTime = endsAt || Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
    
    // Create proposal data
    const proposalData = {
      title,
      description,
      options,
      category,
      createdAt: Math.floor(Date.now() / 1000),
      endsAt: endTime,
      minQuorum: minQuorum || 0 // Default 0 means no quorum requirement
    };
    
    const proposalId = `proposal_${Math.random().toString(36).substring(2, 10)}`;
    
    // Create proposal event
    const event = {
      kind: EVENT_KINDS.PROPOSAL,
      content: JSON.stringify(proposalData),
      tags: [
        ["e", communityId], // Reference to community event
        ["d", proposalId] // Unique identifier
      ]
    };
    
    try {
      const eventId = await this.communityManager.publishEvent(
        this.pool,
        publicKey,
        null, // No private key
        event,
        relays
      );
      return proposalId; // Return the proposal ID on success
    } catch (error) {
      console.error("Error creating proposal:", error);
      return null;
    }
  }
  
  /**
   * Vote on a proposal
   * @param proposalId ID of the proposal event
   * @param optionIndex Index of the selected option (0-based)
   */
  async voteOnProposal(
    proposalId: string,
    optionIndex: number,
    publicKey: string | null,
    relays: string[]
  ): Promise<string | null> {
    if (!publicKey || !proposalId) return null;
    
    // Create vote event
    const event = {
      kind: EVENT_KINDS.VOTE,
      content: JSON.stringify({ optionIndex }),
      tags: [
        ["e", proposalId] // Reference to proposal event
      ]
    };
    
    try {
      const eventId = await this.communityManager.publishEvent(
        this.pool,
        publicKey,
        null, // No private key
        event,
        relays
      );
      return eventId;
    } catch (error) {
      console.error("Error voting on proposal:", error);
      return null;
    }
  }
}
