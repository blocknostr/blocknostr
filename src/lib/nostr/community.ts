
import { SimplePool } from 'nostr-tools';
import { toast } from "sonner";
import { EventManager } from './event';
import { EVENT_KINDS } from './constants';
import { ProposalCategory } from '@/types/community';

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
    relays: string[],
    isPrivate: boolean = false,
    tags: string[] = []
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
        createdAt: Math.floor(Date.now() / 1000),
        isPrivate,
        tags
      };
      
      // Create community event
      const event = {
        kind: EVENT_KINDS.COMMUNITY,
        content: JSON.stringify(communityData),
        tags: [
          ['d', name.toLowerCase().replace(/\s+/g, '-')], // Use as unique identifier
          ['p', currentUserPubkey], // Creator is first member
          ...tags.map(tag => ['t', tag]) // Add tags for discovery
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
    category: ProposalCategory = 'other',
    minQuorum?: number,
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
        category,
        minQuorum,
        endsAt: endsAt || (currentTime + 7 * 24 * 60 * 60) // Use provided endsAt or default to 1 week
      };
      
      // Create proposal event
      const event = {
        kind: EVENT_KINDS.PROPOSAL,
        content: JSON.stringify(proposalData),
        tags: [
          ['e', communityId], // Reference to community
          ['d', `proposal-${Math.random().toString(36).substring(2, 10)}`], // Unique identifier
          ['t', category] // Add category tag
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
        kind: EVENT_KINDS.VOTE,
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
  
  async setCommunityMetadata(
    pool: SimplePool,
    communityId: string,
    uniqueId: string,
    metadataType: 'guidelines' | 'private' | 'tags',
    metadataContent: any,
    currentUserPubkey: string | null,
    privateKey: string | null,
    relays: string[]
  ): Promise<string | null> {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to update community settings");
      return null;
    }
    
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Create metadata event
      const event = {
        kind: EVENT_KINDS.COMMUNITY_METADATA,
        content: JSON.stringify({
          type: metadataType,
          content: metadataContent,
          createdAt: currentTime
        }),
        tags: [
          ['e', communityId], // Reference to community
          ['d', uniqueId],    // Community's unique identifier
          ['p', currentUserPubkey] // Who set this metadata
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
      console.error("Error updating community metadata:", error);
      toast.error("Failed to update community");
      return null;
    }
  }
  
  async createCommunityInvite(
    pool: SimplePool,
    communityId: string,
    uniqueId: string,
    maxUses: number | undefined,
    expiresIn: number | undefined, // hours
    currentUserPubkey: string | null,
    privateKey: string | null,
    relays: string[]
  ): Promise<string | null> {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to create an invite");
      return null;
    }
    
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      const expiresAt = expiresIn ? currentTime + (expiresIn * 60 * 60) : undefined;
      
      // Create invite event
      const event = {
        kind: EVENT_KINDS.COMMUNITY_INVITE,
        content: JSON.stringify({
          maxUses,
          expiresAt,
          usedCount: 0,
          createdAt: currentTime
        }),
        tags: [
          ['e', communityId], // Reference to community
          ['d', uniqueId],    // Community's unique identifier
          ['p', currentUserPubkey] // Invite creator
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
      console.error("Error creating community invite:", error);
      toast.error("Failed to create invite");
      return null;
    }
  }
  
  async assignCommunityRole(
    pool: SimplePool,
    communityId: string,
    uniqueId: string,
    targetPubkey: string,
    role: 'moderator',
    action: 'add' | 'remove',
    currentUserPubkey: string | null,
    privateKey: string | null,
    relays: string[]
  ): Promise<string | null> {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to manage roles");
      return null;
    }
    
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Create role event
      const event = {
        kind: EVENT_KINDS.COMMUNITY_ROLE,
        content: JSON.stringify({
          role,
          action,
          createdAt: currentTime
        }),
        tags: [
          ['e', communityId], // Reference to community
          ['d', uniqueId],    // Community's unique identifier
          ['p', currentUserPubkey, 'creator'], // Who is assigning this role
          ['p', targetPubkey, role] // Who is receiving this role
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
      console.error("Error assigning community role:", error);
      toast.error("Failed to update role");
      return null;
    }
  }
  
  async kickCommunityMember(
    pool: SimplePool,
    communityId: string,
    uniqueId: string,
    members: string[],
    createdAt: number,
    creator: string,
    name: string,
    description: string,
    image: string,
    targetMember: string,
    currentUserPubkey: string | null,
    privateKey: string | null,
    relays: string[]
  ): Promise<string | null> {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to remove a member");
      return null;
    }
    
    try {
      // Remove member from list
      const updatedMembers = members.filter(member => member !== targetMember);
      
      // Create an updated community event without the kicked member
      const communityData = {
        name,
        description,
        image,
        creator,
        createdAt
      };
      
      const event = {
        kind: EVENT_KINDS.COMMUNITY,
        content: JSON.stringify(communityData),
        tags: [
          ['d', uniqueId],
          ...updatedMembers.map(member => ['p', member])
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
      console.error("Error kicking member:", error);
      toast.error("Failed to remove member");
      return null;
    }
  }
}
