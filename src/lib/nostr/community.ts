
import { SimplePool } from 'nostr-tools';
import { EventManager } from './event';
import { EVENT_KINDS } from './constants';
import type { ProposalCategory } from '@/api/types/community';

export class CommunityManager {
  private eventManager: EventManager;
  
  constructor(eventManager: EventManager) {
    this.eventManager = eventManager;
  }
  
  /**
   * Create a new community
   * @returns Community ID if successful, null otherwise
   */
  async createCommunity(
    pool: SimplePool,
    name: string,
    description: string,
    publicKey: string | null,
    privateKey: string | null,
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
    
    return this.eventManager.publishEvent(pool, publicKey, privateKey, event, relays);
  }
  
  /**
   * Create a proposal for a community
   */
  async createProposal(
    pool: SimplePool,
    communityId: string,
    title: string,
    description: string,
    options: string[],
    publicKey: string | null,
    privateKey: string | null,
    relays: string[],
    category: ProposalCategory = 'other',
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
    
    // Create proposal event
    const event = {
      kind: EVENT_KINDS.PROPOSAL,
      content: JSON.stringify(proposalData),
      tags: [
        ["e", communityId], // Reference to community event
        ["d", `proposal_${Math.random().toString(36).substring(2, 10)}`] // Unique identifier
      ]
    };
    
    return this.eventManager.publishEvent(pool, publicKey, privateKey, event, relays);
  }
  
  /**
   * Vote on a proposal
   * @param proposalId ID of the proposal event
   * @param optionIndex Index of the selected option (0-based)
   */
  async voteOnProposal(
    pool: SimplePool,
    proposalId: string,
    optionIndex: number,
    publicKey: string | null,
    privateKey: string | null,
    relays: string[]
  ): Promise<string | null> {
    if (!publicKey || !proposalId) return null;
    
    // Create vote event
    const event = {
      kind: EVENT_KINDS.VOTE,
      content: JSON.stringify({ optionIndex }),
      tags: [
        ["e", proposalId], // Reference to proposal event
        ["d", `vote_${Math.random().toString(36).substring(2, 10)}`] // Unique identifier
      ]
    };
    
    return this.eventManager.publishEvent(pool, publicKey, privateKey, event, relays);
  }
}

