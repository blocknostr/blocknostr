
import { SimplePool } from 'nostr-tools';
import { NostrEvent } from '../types';
import { EVENT_KINDS } from '../constants';
import type { ProposalCategory } from '@/types/community';

/**
 * Community service that handles community-related methods
 */
export class CommunityService {
  constructor(private eventManager: any, private getConnectedRelayUrls: () => string[], 
              private pool: SimplePool, private publicKey: string | null) {}

  /**
   * Fetch a community by its ID
   * @param communityId - The ID of the community to fetch
   * @returns Promise resolving to community data or null if not found
   */
  async fetchCommunity(communityId: string): Promise<{
    id: string;
    name: string;
    description: string;
    image: string;
    creator: string;
    createdAt: number;
    members: string[];
    uniqueId: string;
  } | null> {
    if (!communityId) return null;
    
    try {
      const connectedRelays = this.getConnectedRelayUrls();
      
      return new Promise((resolve) => {
        const subscribe = (filters: any, onEvent: (event: NostrEvent) => void): string => {
          return this.pool.subscribe(connectedRelays, filters, {
            onevent: onEvent
          }).sub;
        };
        
        const unsubscribe = (subId: string): void => {
          const sub = this.pool.subscriptions.get(subId);
          if (sub) sub.close();
        };
        
        const subId = subscribe(
          {
            kinds: [EVENT_KINDS.COMMUNITY],
            ids: [communityId],
            limit: 1
          },
          (event) => {
            try {
              // Parse content and extract community data
              const content = JSON.parse(event.content);
              
              // Get members from p tags
              const members = event.tags
                .filter(tag => tag.length >= 2 && tag[0] === 'p')
                .map(tag => tag[1]);
              
              // Extract unique identifier from d tag
              const dTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'd');
              const uniqueId = dTag ? dTag[1] : '';
              
              // Construct community object
              const community = {
                id: event.id,
                name: content.name || '',
                description: content.description || '',
                image: content.image || '',
                creator: content.creator || event.pubkey,
                createdAt: content.createdAt || event.created_at,
                members,
                uniqueId
              };
              
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
  async createCommunity(name: string, description: string): Promise<string | null> {
    const connectedRelays = this.getConnectedRelayUrls();
    if (!this.eventManager) {
      console.error("Event manager not initialized");
      return null;
    }
    
    return this.eventManager.communityManager.createCommunity(
      this.pool,
      name,
      description,
      this.publicKey,
      null, // We're not storing private keys
      connectedRelays
    );
  }
  
  /**
   * Create a proposal for a community
   */
  async createProposal(
    communityId: string, 
    title: string, 
    description: string, 
    options: string[],
    category?: ProposalCategory,
    minQuorum?: number,
    endsAt?: number
  ): Promise<string | null> {
    const connectedRelays = this.getConnectedRelayUrls();
    return this.eventManager.communityManager.createProposal(
      this.pool,
      communityId,
      title,
      description,
      options,
      this.publicKey,
      null, // We're not storing private keys
      connectedRelays,
      category || 'other',
      minQuorum,
      endsAt
    );
  }
  
  /**
   * Vote on a proposal
   */
  async voteOnProposal(proposalId: string, optionIndex: number): Promise<string | null> {
    const connectedRelays = this.getConnectedRelayUrls();
    return this.eventManager.communityManager.voteOnProposal(
      this.pool,
      proposalId,
      optionIndex,
      this.publicKey,
      null, // We're not storing private keys
      connectedRelays
    );
  }
}
