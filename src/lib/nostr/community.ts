
import { SimplePool } from 'nostr-tools';
import { EventManager } from './event';
import { EVENT_KINDS, NIP72 } from './constants';
import type { ProposalCategory } from '@/types/community';

export class CommunityManager {
  private eventManager: EventManager;
  
  constructor(eventManager: EventManager) {
    this.eventManager = eventManager;
  }
  
  /**
   * Create a new community following NIP-72 standard
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
    
    // Generate community ID according to NIP-72 
    const randomId = Math.random().toString(36).substring(2, 10);
    const uniqueId = `${NIP72.D_TAG_PREFIX}${randomId}`;
    
    // Create community metadata according to NIP-72
    const communityData = {
      name,
      description,
      creator: publicKey,
      created_at: Math.floor(Date.now() / 1000),
      image: "", // Optional image URL
      version: NIP72.VERSION
    };
    
    // Create NIP-72 compatible event
    const event = {
      kind: EVENT_KINDS.COMMUNITY_DEFINITION,
      content: JSON.stringify(communityData),
      tags: [
        ["d", uniqueId], // Unique identifier for this community
        ["p", publicKey], // Creator is the first member
        ["nip", "72"] // Explicitly mark as NIP-72 compliant
      ]
    };
    
    return this.eventManager.publishEvent(pool, publicKey, privateKey, event, relays);
  }
  
  /**
   * Create a proposal for a community using NIP-72 replaceable events
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
    
    // Create proposal data with NIP-72 compatibility
    const proposalData = {
      title,
      description,
      options,
      category,
      createdAt: Math.floor(Date.now() / 1000),
      endsAt: endTime,
      minQuorum: minQuorum || 0, // Default 0 means no quorum requirement
      version: NIP72.VERSION
    };
    
    // Create unique proposal identifier
    const proposalUniqueId = `proposal_${Math.random().toString(36).substring(2, 10)}`;
    
    // Create proposal event
    const event = {
      kind: EVENT_KINDS.PROPOSAL,
      content: JSON.stringify(proposalData),
      tags: [
        ["e", communityId], // Reference to community event
        ["d", proposalUniqueId], // Unique identifier for replaceable event
        ["nip", "72"], // Explicitly mark as NIP-72 compliant
        ["client", "BlockNoster"] // Identify our client
      ]
    };
    
    return this.eventManager.publishEvent(pool, publicKey, privateKey, event, relays);
  }
  
  /**
   * Vote on a proposal
   * @param proposalId ID of the proposal event
   * @param optionIndex Index of the selected option (0-based)
   * Uses standard reaction event (kind 7) for compatibility with NIP-25 and NIP-72
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
    
    // Create vote event using standard reaction kind (7) for NIP-72 compatibility
    const event = {
      kind: EVENT_KINDS.REACTION,
      content: optionIndex.toString(), // Store option index as content string
      tags: [
        ["e", proposalId], // Reference to proposal event
        ["nip", "72"], // Explicitly mark as NIP-72 compliant
        ["client", "BlockNoster"], // Identify our client
        ["d", `vote_${Math.random().toString(36).substring(2, 10)}`] // Unique identifier
      ]
    };
    
    return this.eventManager.publishEvent(pool, publicKey, privateKey, event, relays);
  }
}
