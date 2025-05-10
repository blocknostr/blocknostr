
import { SimplePool } from 'nostr-tools';
import { toast } from "sonner";
import { EventManager } from './event';
import { EVENT_KINDS } from './constants';

export class CommunityManager {
  private eventManager: EventManager;
  
  constructor(eventManager: EventManager) {
    this.eventManager = eventManager;
  }
  
  async createCommunity(
    pool: SimplePool,
    name: string,
    description: string,
    currentUserPubkey: string | null,
    privateKey: string | null,
    relays: string[]
  ): Promise<string | null> {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to create a community");
      return null;
    }
    
    try {
      const communityData = {
        name,
        description,
        image: "",
        creator: currentUserPubkey,
        createdAt: Math.floor(Date.now() / 1000)
      };
      
      // Create community event
      const event = {
        kind: EVENT_KINDS.COMMUNITY,
        content: JSON.stringify(communityData),
        tags: [
          ['d', name.toLowerCase().replace(/\s+/g, '-')], // Use as unique identifier
          ['p', currentUserPubkey] // Creator is first member
        ]
      };
      
      return await this.eventManager.publishEvent(
        pool,
        currentUserPubkey,
        privateKey,
        event,
        relays
      );
    } catch (error) {
      console.error("Error creating community:", error);
      toast.error("Failed to create community");
      return null;
    }
  }
  
  async createProposal(
    pool: SimplePool,
    communityId: string,
    title: string,
    description: string, 
    options: string[],
    currentUserPubkey: string | null,
    privateKey: string | null,
    relays: string[],
    endsAt?: number
  ): Promise<string | null> {
    if (!currentUserPubkey) {
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
        kind: EVENT_KINDS.PROPOSAL, // Now using the constant we added
        content: JSON.stringify(proposalData),
        tags: [
          ['e', communityId], // Reference to community
          ['d', `proposal-${Math.random().toString(36).substring(2, 10)}`] // Unique identifier
        ]
      };
      
      return await this.eventManager.publishEvent(
        pool,
        currentUserPubkey,
        privateKey,
        event,
        relays
      );
    } catch (error) {
      console.error("Error creating proposal:", error);
      toast.error("Failed to create proposal");
      return null;
    }
  }
  
  async voteOnProposal(
    pool: SimplePool,
    proposalId: string,
    optionIndex: number,
    currentUserPubkey: string | null,
    privateKey: string | null,
    relays: string[]
  ): Promise<string | null> {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to vote");
      return null;
    }
    
    try {
      console.log(`Publishing vote for proposal ${proposalId}, option ${optionIndex}`);
      
      // Create vote event
      const event = {
        kind: EVENT_KINDS.VOTE, // Now using the constant we added
        content: optionIndex.toString(), // Content must be a string
        tags: [
          ['e', proposalId] // Reference to proposal
        ]
      };
      
      const eventId = await this.eventManager.publishEvent(
        pool,
        currentUserPubkey,
        privateKey,
        event,
        relays
      );
      
      console.log("Vote published with ID:", eventId);
      return eventId;
    } catch (error) {
      console.error("Error voting on proposal:", error);
      toast.error("Failed to vote");
      return null;
    }
  }
}
