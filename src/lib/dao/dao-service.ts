import { SimplePool, Event, nip19, Filter } from 'nostr-tools';
import { DAO, DAOProposal } from '@/types/dao';
import { nostrService } from '@/lib/nostr';
import { daoCache } from './dao-cache';
import { EVENT_KINDS } from '@/lib/nostr/constants';

// NIP-72 kind numbers (ensure full compliance)
const DAO_KINDS = {
  COMMUNITY: EVENT_KINDS.COMMUNITY,
  PROPOSAL: EVENT_KINDS.PROPOSAL,
  VOTE: EVENT_KINDS.VOTE,
  METADATA: 34553,       // Community metadata (guidelines, etc)
  MODERATION: 34554,      // Moderation events (kick, ban)
  INVITE: 34555,         // Invite to private community
};

/**
 * Service for interacting with DAOs using NIP-72
 */
export class DAOService {
  private pool: SimplePool;
  private relays: string[];
  private fastRelays: string[]; // Subset of faster, more reliable relays
  
  constructor() {
    this.pool = new SimplePool();
    // Add NIP-72 compatible relays
    this.relays = [
      "wss://relay.damus.io",
      "wss://nos.lol",
      "wss://relay.nostr.band",
      "wss://nostr.bitcoiner.social",
      "wss://relay.nostr.bg",
      "wss://relay.snort.social"
    ];
    
    // Faster subset for initial loads
    this.fastRelays = [
      "wss://relay.damus.io",
      "wss://nos.lol",
      "wss://relay.nostr.band"
    ];
  }
  
  /**
   * Get list of DAOs/communities
   */
  async getDAOs(limit: number = 20): Promise<DAO[]> {
    try {
      // Try to get from cache first
      const cachedDAOs = daoCache.getAllDAOs();
      if (cachedDAOs) {
        console.log("Using cached DAOs");
        // Fetch fresh data in the background to update cache
        this.refreshDAOs(limit);
        return cachedDAOs.filter(dao => dao.name !== "Unnamed DAO" && dao.name.trim() !== "");
      }
      
      const filter: Filter = {
        kinds: [DAO_KINDS.COMMUNITY],
        limit: limit
      };
      
      console.log("Fetching DAOs with filter:", filter);
      console.log("Using fast relays:", this.fastRelays);
      
      // Use the fetch method of SimplePool instead of list
      const events = await this.pool.querySync(this.fastRelays, [filter]);
      console.log("Received DAO events:", events.length);
      
      const daos = events
        .map(event => this.parseDaoEvent(event))
        .filter((dao): dao is DAO => 
          dao !== null && 
          dao.name !== "Unnamed DAO" && 
          dao.name.trim() !== ""
        );
      
      // Cache the results
      daoCache.cacheAllDAOs(daos);
      
      return daos;
    } catch (error) {
      console.error("Error fetching DAOs:", error);
      return [];
    }
  }
  
  /**
   * Background refresh of DAOs to update cache
   */
  private async refreshDAOs(limit: number = 20): Promise<void> {
    try {
      const filter: Filter = {
        kinds: [DAO_KINDS.COMMUNITY],
        limit: limit
      };
      
      // Use querySync instead of list
      const events = await this.pool.querySync(this.relays, [filter]);
      
      const daos = events
        .map(event => this.parseDaoEvent(event))
        .filter((dao): dao is DAO => dao !== null);
      
      // Update cache with fresh data
      daoCache.cacheAllDAOs(daos);
    } catch (error) {
      console.error("Error refreshing DAOs:", error);
    }
  }
  
  /**
   * Get DAOs that a user is a member of
   */
  async getUserDAOs(pubkey: string, limit: number = 20): Promise<DAO[]> {
    if (!pubkey) return [];
    
    try {
      // Try to get from cache first
      const cachedUserDAOs = daoCache.getUserDAOs(pubkey);
      if (cachedUserDAOs) {
        console.log(`Using cached DAOs for user ${pubkey}`);
        // Fetch fresh data in the background
        this.refreshUserDAOs(pubkey, limit);
        return cachedUserDAOs;
      }
      
      const filter: Filter = {
        kinds: [DAO_KINDS.COMMUNITY],
        '#p': [pubkey],
        limit: limit
      };
      
      console.log(`Fetching DAOs for user ${pubkey}`);
      const events = await this.pool.querySync(this.fastRelays, [filter]);
      console.log(`Received ${events.length} user DAO events`);
      
      const daos = events
        .map(event => this.parseDaoEvent(event))
        .filter((dao): dao is DAO => dao !== null);
      
      // Cache the results
      daoCache.cacheUserDAOs(pubkey, daos);
      
      return daos;
    } catch (error) {
      console.error("Error fetching user DAOs:", error);
      return [];
    }
  }
  
  /**
   * Background refresh of user DAOs
   */
  private async refreshUserDAOs(pubkey: string, limit: number = 20): Promise<void> {
    try {
      const filter: Filter = {
        kinds: [DAO_KINDS.COMMUNITY],
        '#p': [pubkey],
        limit: limit
      };
      
      const events = await this.pool.querySync(this.relays, [filter]);
      
      const daos = events
        .map(event => this.parseDaoEvent(event))
        .filter((dao): dao is DAO => dao !== null);
      
      // Update cache with fresh data
      daoCache.cacheUserDAOs(pubkey, daos);
    } catch (error) {
      console.error(`Error refreshing user DAOs for ${pubkey}:`, error);
    }
  }
  
  /**
   * Get trending DAOs based on member count
   */
  async getTrendingDAOs(limit: number = 20): Promise<DAO[]> {
    // Try to get from cache first
    const cachedTrending = daoCache.getTrendingDAOs();
    if (cachedTrending) {
      console.log("Using cached trending DAOs");
      return cachedTrending;
    }
    
    const daos = await this.getDAOs(limit * 2);
    const trending = daos
      .sort((a, b) => b.members.length - a.members.length)
      .slice(0, limit);
      
    // Cache trending results
    daoCache.cacheTrendingDAOs(trending);
    
    return trending;
  }
  
  /**
   * Get a single DAO by ID
   */
  async getDAOById(id: string): Promise<DAO | null> {
    try {
      // Check cache first
      const cachedDAO = daoCache.getDAODetails(id);
      if (cachedDAO) {
        console.log(`Using cached DAO with ID: ${id}`);
        // Refresh in background
        this.refreshDAOById(id);
        return cachedDAO;
      }
      
      console.log(`Fetching DAO with ID: ${id}`);
      
      const filter: Filter = {
        kinds: [DAO_KINDS.COMMUNITY],
        ids: [id],
        limit: 1
      };
      
      const events = await this.pool.querySync(this.fastRelays, [filter]);
      
      if (events.length === 0) {
        console.log(`No DAO found with ID: ${id}`);
        return null;
      }
      
      const dao = this.parseDaoEvent(events[0]);
      
      // Cache the result
      if (dao) {
        daoCache.cacheDAODetails(id, dao);
      }
      
      return dao;
    } catch (error) {
      console.error(`Error fetching DAO ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Background refresh of a single DAO
   */
  private async refreshDAOById(id: string): Promise<void> {
    try {
      const filter: Filter = {
        kinds: [DAO_KINDS.COMMUNITY],
        ids: [id],
        limit: 1
      };
      
      const events = await this.pool.querySync(this.relays, [filter]);
      
      if (events.length > 0) {
        const dao = this.parseDaoEvent(events[0]);
        if (dao) {
          daoCache.cacheDAODetails(id, dao);
        }
      }
    } catch (error) {
      console.error(`Error refreshing DAO ${id}:`, error);
    }
  }
  
  /**
   * Get DAO proposals
   */
  async getDAOProposals(daoId: string): Promise<DAOProposal[]> {
    try {
      // Check cache first
      const cachedProposals = daoCache.getProposals(daoId);
      if (cachedProposals) {
        console.log(`Using cached proposals for DAO: ${daoId}`);
        // Refresh in background
        this.refreshDAOProposals(daoId);
        return cachedProposals;
      }
      
      const filter: Filter = {
        kinds: [DAO_KINDS.PROPOSAL],
        '#e': [daoId],
        limit: 50
      };
      
      console.log(`Fetching proposals for DAO: ${daoId}`);
      const events = await this.pool.querySync(this.fastRelays, [filter]);
      console.log(`Found ${events.length} proposals for DAO ${daoId}`);
      
      const proposals = events
        .map(event => this.parseProposalEvent(event, daoId))
        .filter((proposal): proposal is DAOProposal => proposal !== null);
        
      // Fetch votes for each proposal
      const votesPromises = proposals.map(proposal => this.getVotesForProposal(proposal.id));
      const votesResults = await Promise.all(votesPromises);
      
      // Merge votes into proposals
      const proposalsWithVotes = proposals.map((proposal, index) => ({
        ...proposal,
        votes: votesResults[index]
      }));
      
      // Cache the result
      daoCache.cacheProposals(daoId, proposalsWithVotes);
      
      return proposalsWithVotes;
    } catch (error) {
      console.error(`Error fetching proposals for DAO ${daoId}:`, error);
      return [];
    }
  }
  
  /**
   * Background refresh of DAO proposals
   */
  private async refreshDAOProposals(daoId: string): Promise<void> {
    try {
      const filter: Filter = {
        kinds: [DAO_KINDS.PROPOSAL],
        '#e': [daoId],
        limit: 50
      };
      
      const events = await this.pool.querySync(this.relays, [filter]);
      
      const proposals = events
        .map(event => this.parseProposalEvent(event, daoId))
        .filter((proposal): proposal is DAOProposal => proposal !== null);
        
      // Only fetch votes for active proposals to save bandwidth
      const activeProposals = proposals.filter(p => p.status === "active");
      const votesPromises = activeProposals.map(proposal => this.getVotesForProposal(proposal.id));
      const votesResults = await Promise.all(votesPromises);
      
      // Update only active proposals with votes
      activeProposals.forEach((proposal, index) => {
        proposal.votes = votesResults[index];
      });
      
      // For non-active proposals, keep existing votes or use empty object
      const allProposalsWithVotes = proposals.map(proposal => {
        if (proposal.status !== "active") {
          const existingProposal = daoCache.getProposals(daoId)?.find(p => p.id === proposal.id);
          return {
            ...proposal,
            votes: existingProposal?.votes || {}
          };
        }
        return proposal;
      });
      
      // Cache the updated result
      daoCache.cacheProposals(daoId, allProposalsWithVotes);
    } catch (error) {
      console.error(`Error refreshing proposals for DAO ${daoId}:`, error);
    }
  }
  
  /**
   * Get votes for a specific proposal
   */
  async getVotesForProposal(proposalId: string): Promise<Record<string, number>> {
    try {
      const filter: Filter = {
        kinds: [DAO_KINDS.VOTE],
        '#e': [proposalId],
        limit: 200
      };
      
      const events = await this.pool.querySync(this.relays, [filter]);
      console.log(`Found ${events.length} votes for proposal ${proposalId}`);
      
      const votes: Record<string, number> = {};
      
      for (const event of events) {
        try {
          // Handle both JSON and non-JSON vote formats (for compatibility)
          let optionIndex: number;
          
          if (event.content.startsWith('{')) {
            const content = JSON.parse(event.content);
            optionIndex = content.optionIndex;
          } else {
            // Simple format where content is just the option index
            optionIndex = parseInt(event.content.trim());
          }
          
          if (!isNaN(optionIndex) && event.pubkey) {
            votes[event.pubkey] = optionIndex;
          }
        } catch (e) {
          console.error("Error parsing vote content:", e, "Content:", event.content);
        }
      }
      
      return votes;
    } catch (error) {
      console.error(`Error fetching votes for proposal ${proposalId}:`, error);
      return {};
    }
  }
  
  /**
   * Create a new DAO/community
   */
  async createDAO(name: string, description: string, tags: string[] = []): Promise<string | null> {
    try {
      // Get the user's pubkey from the Nostr service
      const pubkey = nostrService.publicKey;
      if (!pubkey) {
        throw new Error("User not authenticated");
      }
      
      // Validate name - prevent empty names
      const trimmedName = name.trim();
      if (!trimmedName) {
        console.error("DAO creation failed: Name cannot be empty");
        throw new Error("DAO name cannot be empty");
      }
      
      console.log(`Creating DAO: ${trimmedName} with creator ${pubkey}`);
      
      // Generate a unique identifier for the DAO
      const uniqueId = `dao_${Math.random().toString(36).substring(2, 10)}`;
      
      const communityData = {
        name: trimmedName, // Use trimmed name
        description,
        creator: pubkey,
        createdAt: Math.floor(Date.now() / 1000),
        image: "", // Optional image URL
        treasury: {
          balance: 0,
          tokenSymbol: "ALPH"
        },
        proposals: 0,
        activeProposals: 0,
        tags: tags
      };
      
      // NIP-72 compliant community event
      const eventData = {
        kind: DAO_KINDS.COMMUNITY,
        content: JSON.stringify(communityData),
        tags: [
          ["d", uniqueId], // Unique identifier as required by NIP-72
          ["p", pubkey] // Creator is the first member
        ]
      };
      
      console.log("Publishing DAO event:", eventData);
      
      // Publish the event using nostrService
      const eventId = await nostrService.publishEvent(eventData);
      console.log("DAO created with ID:", eventId);
      
      if (eventId && pubkey) {
        daoCache.invalidateUserDAOs(pubkey);
        setTimeout(() => daoCache.clearAll(), 1000); // Clear all DAO caches after a delay
      }
      
      return eventId;
    } catch (error) {
      console.error("Error creating DAO:", error);
      return null;
    }
  }
  
  /**
   * Create a proposal for a DAO
   */
  async createProposal(
    daoId: string,
    title: string,
    description: string,
    options: string[],
    durationDays: number = 7
  ): Promise<string | null> {
    try {
      const pubkey = nostrService.publicKey;
      if (!pubkey) {
        throw new Error("User not authenticated");
      }
      
      const now = Math.floor(Date.now() / 1000);
      const endsAt = now + (durationDays * 24 * 60 * 60); // Convert days to seconds
      
      const proposalData = {
        title,
        description,
        options,
        createdAt: now,
        endsAt: endsAt,
      };
      
      // Generate a unique identifier for the proposal
      const uniqueId = `proposal_${Math.random().toString(36).substring(2, 10)}`;
      
      // NIP-72 compliant proposal event
      const eventData = {
        kind: DAO_KINDS.PROPOSAL,
        content: JSON.stringify(proposalData),
        tags: [
          ["e", daoId], // Reference to DAO/community event
          ["d", uniqueId] // Unique identifier
        ]
      };
      
      console.log("Publishing proposal event:", eventData);
      
      const eventId = await nostrService.publishEvent(eventData);
      console.log("Proposal created with ID:", eventId);
      
      return eventId;
    } catch (error) {
      console.error("Error creating proposal:", error);
      return null;
    }
  }
  
  /**
   * Vote on a proposal
   */
  async voteOnProposal(proposalId: string, optionIndex: number): Promise<string | null> {
    try {
      const pubkey = nostrService.publicKey;
      if (!pubkey) {
        throw new Error("User not authenticated");
      }
      
      // NIP-72 compliant vote event - keep content simple
      const eventData = {
        kind: DAO_KINDS.VOTE,
        content: JSON.stringify({ optionIndex }),
        tags: [
          ["e", proposalId] // Reference to proposal event
        ]
      };
      
      console.log("Publishing vote event:", eventData);
      
      const eventId = await nostrService.publishEvent(eventData);
      console.log("Vote recorded with ID:", eventId);
      
      return eventId;
    } catch (error) {
      console.error("Error voting on proposal:", error);
      return null;
    }
  }
  
  /**
   * Vote on kick proposal with the same mechanism
   */
  async voteOnKickProposal(proposalId: string, optionIndex: number): Promise<string | null> {
    return this.voteOnProposal(proposalId, optionIndex);
  }
  
  /**
   * Join a DAO/community
   */
  async joinDAO(daoId: string): Promise<boolean> {
    try {
      // First fetch the DAO to get current data
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        console.error("DAO not found:", daoId);
        throw new Error("DAO not found");
      }
      
      const pubkey = nostrService.publicKey;
      if (!pubkey) {
        throw new Error("User not authenticated");
      }
      
      console.log(`User ${pubkey} joining DAO ${daoId}`);
      
      // Check if already a member
      if (dao.members.includes(pubkey)) {
        console.log("Already a member of this DAO");
        return true;
      }
      
      // Extract the unique identifier from d tag if available
      let uniqueId = daoId;
      const event = await this.getDAOEventById(daoId);
      if (event) {
        const dTag = event.tags.find(tag => tag[0] === 'd');
        if (dTag && dTag[1]) {
          uniqueId = dTag[1];
        }
      }
      
      // Create updated member list including the current user
      const members = [...dao.members, pubkey];
      
      // Create a new community event with the same uniqueId
      // This follows NIP-72 replacement approach
      const updatedData = {
        name: dao.name,
        description: dao.description,
        creator: dao.creator,
        createdAt: dao.createdAt,
        image: dao.image,
        guidelines: dao.guidelines,
        isPrivate: dao.isPrivate,
        treasury: dao.treasury,
        proposals: dao.proposals,
        activeProposals: dao.activeProposals,
        tags: dao.tags
      };
      
      // NIP-72 compliant event for joining
      const eventData = {
        kind: DAO_KINDS.COMMUNITY,
        content: JSON.stringify(updatedData),
        tags: [
          ["d", uniqueId], // Same unique identifier
          ...members.map(member => ["p", member]) // Include all members
        ]
      };
      
      console.log("Publishing join DAO event:", eventData);
      
      await nostrService.publishEvent(eventData);
      console.log(`Successfully joined DAO ${daoId}`);
      
      return true;
    } catch (error) {
      console.error("Error joining DAO:", error);
      return false;
    }
  }
  
  /**
   * Update DAO metadata (privacy, guidelines, tags)
   */
  async updateDAOMetadata(daoId: string, metadata: {
    type: string;
    content?: any;
    isPrivate?: boolean;
  }): Promise<boolean> {
    try {
      // Get the current DAO data
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        console.error("DAO not found:", daoId);
        return false;
      }
      
      const pubkey = nostrService.publicKey;
      if (!pubkey) {
        throw new Error("User not authenticated");
      }
      
      // Only the creator can update metadata
      if (dao.creator !== pubkey) {
        throw new Error("Only the DAO creator can update metadata");
      }
      
      console.log(`Updating DAO metadata for ${daoId}, type: ${metadata.type}`);
      
      // Create updated data based on metadata type
      let updatedData = { ...dao };
      
      switch (metadata.type) {
        case "privacy":
          updatedData.isPrivate = metadata.isPrivate;
          break;
        case "guidelines":
          updatedData.guidelines = metadata.content;
          break;
        case "tags":
          updatedData.tags = metadata.content;
          break;
        default:
          throw new Error("Unknown metadata type");
      }
      
      // Get the original unique identifier if available
      let uniqueId = daoId;
      const event = await this.getDAOEventById(daoId);
      if (event) {
        const dTag = event.tags.find(tag => tag[0] === 'd');
        if (dTag && dTag[1]) {
          uniqueId = dTag[1];
        }
      }
      
      // NIP-72 compliant event for metadata update
      const eventData = {
        kind: DAO_KINDS.METADATA,
        content: JSON.stringify({ 
          type: metadata.type,
          content: metadata.content,
          isPrivate: metadata.isPrivate,
          updatedAt: Math.floor(Date.now() / 1000)
        }),
        tags: [
          ["e", daoId], // Reference to DAO
          ["d", uniqueId]
        ]
      };
      
      console.log("Publishing DAO metadata event:", eventData);
      await nostrService.publishEvent(eventData);
      
      // Also update the main DAO definition with the changes for clients that don't follow the metadata events
      // This ensures backwards compatibility
      const mainEventData = {
        kind: DAO_KINDS.COMMUNITY,
        content: JSON.stringify({
          name: dao.name,
          description: dao.description,
          creator: dao.creator,
          createdAt: dao.createdAt,
          image: dao.image,
          guidelines: metadata.type === "guidelines" ? metadata.content : dao.guidelines,
          isPrivate: metadata.type === "privacy" ? metadata.isPrivate : dao.isPrivate,
          treasury: dao.treasury,
          proposals: dao.proposals,
          activeProposals: dao.activeProposals,
          tags: metadata.type === "tags" ? metadata.content : dao.tags
        }),
        tags: [
          ["d", uniqueId],
          ...dao.members.map(member => ["p", member]),
          ...dao.moderators.map(mod => ["p", mod, "moderator"])
        ]
      };
      
      await nostrService.publishEvent(mainEventData);
      
      console.log(`Successfully updated DAO ${daoId} metadata`);
      return true;
    } catch (error) {
      console.error("Error updating DAO metadata:", error);
      return false;
    }
  }
  
  /**
   * Update DAO guidelines specifically
   */
  async updateDAOGuidelines(daoId: string, guidelines: string): Promise<boolean> {
    return this.updateDAOMetadata(daoId, { type: "guidelines", content: guidelines });
  }
  
  /**
   * Update DAO tags specifically
   */
  async updateDAOTags(daoId: string, tags: string[]): Promise<boolean> {
    return this.updateDAOMetadata(daoId, { type: "tags", content: tags });
  }
  
  /**
   * Update DAO roles (add/remove moderators)
   */
  async updateDAORoles(daoId: string, update: {
    role: string;
    action: "add" | "remove";
    pubkey: string;
  }): Promise<boolean> {
    try {
      // Get the current DAO data
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        console.error("DAO not found:", daoId);
        return false;
      }
      
      const pubkey = nostrService.publicKey;
      if (!pubkey) {
        throw new Error("User not authenticated");
      }
      
      // Only the creator can update roles
      if (dao.creator !== pubkey) {
        throw new Error("Only the DAO creator can update roles");
      }
      
      console.log(`Updating DAO role for ${daoId}, ${update.action} ${update.role}: ${update.pubkey}`);
      
      // Update the moderators list
      let moderators = [...dao.moderators];
      
      if (update.role === "moderator") {
        if (update.action === "add" && !moderators.includes(update.pubkey)) {
          moderators.push(update.pubkey);
        } else if (update.action === "remove") {
          moderators = moderators.filter(mod => mod !== update.pubkey);
        }
      }
      
      // Get the original unique identifier if available
      let uniqueId = daoId;
      const event = await this.getDAOEventById(daoId);
      if (event) {
        const dTag = event.tags.find(tag => tag[0] === 'd');
        if (dTag && dTag[1]) {
          uniqueId = dTag[1];
        }
      }
      
      // NIP-72 compliant event for role update
      const eventData = {
        kind: DAO_KINDS.MODERATION,
        content: JSON.stringify({ 
          role: update.role,
          action: update.action,
          updatedAt: Math.floor(Date.now() / 1000)
        }),
        tags: [
          ["e", daoId], // Reference to DAO
          ["p", update.pubkey, update.role] // Target pubkey with role
        ]
      };
      
      console.log("Publishing DAO role event:", eventData);
      await nostrService.publishEvent(eventData);
      
      // Also update the main DAO definition with the new moderators
      // This ensures backwards compatibility
      const mainEventData = {
        kind: DAO_KINDS.COMMUNITY,
        content: JSON.stringify({
          name: dao.name,
          description: dao.description,
          creator: dao.creator,
          createdAt: dao.createdAt,
          image: dao.image,
          guidelines: dao.guidelines,
          isPrivate: dao.isPrivate,
          treasury: dao.treasury,
          proposals: dao.proposals,
          activeProposals: dao.activeProposals,
          tags: dao.tags
        }),
        tags: [
          ["d", uniqueId],
          ...dao.members.map(member => ["p", member]),
          ...moderators.map(mod => ["p", mod, "moderator"])
        ]
      };
      
      await nostrService.publishEvent(mainEventData);
      
      console.log(`Successfully updated DAO ${daoId} roles`);
      return true;
    } catch (error) {
      console.error("Error updating DAO roles:", error);
      return false;
    }
  }
  
  /**
   * Add DAO moderator specifically
   */
  async addDAOModerator(daoId: string, pubkey: string): Promise<boolean> {
    return this.updateDAORoles(daoId, { role: "moderator", action: "add", pubkey });
  }
  
  /**
   * Remove DAO moderator specifically
   */
  async removeDAOModerator(daoId: string, pubkey: string): Promise<boolean> {
    return this.updateDAORoles(daoId, { role: "moderator", action: "remove", pubkey });
  }
  
  /**
   * Create invite link for a DAO
   */
  async createDAOInvite(daoId: string, expiresIn?: number, maxUses?: number): Promise<string | null> {
    try {
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        console.error("DAO not found:", daoId);
        return null;
      }
      
      const pubkey = nostrService.publicKey;
      if (!pubkey) {
        throw new Error("User not authenticated");
      }
      
      // Check if user is creator or moderator
      if (dao.creator !== pubkey && !dao.moderators.includes(pubkey)) {
        throw new Error("Only creator or moderators can create invites");
      }
      
      const now = Math.floor(Date.now() / 1000);
      const inviteData = {
        daoId,
        createdAt: now,
        creatorPubkey: pubkey,
        expiresAt: expiresIn ? now + expiresIn : undefined,
        maxUses,
        usedCount: 0
      };
      
      // Create a unique identifier for this invite
      const uniqueId = `invite_${Math.random().toString(36).substring(2, 10)}`;
      
      // NIP-72 compliant event for invitation
      const eventData = {
        kind: DAO_KINDS.INVITE,
        content: JSON.stringify(inviteData),
        tags: [
          ["e", daoId], // Reference to DAO
          ["d", uniqueId] // Unique identifier for this invite
        ]
      };
      
      console.log("Publishing DAO invite event:", eventData);
      const inviteId = await nostrService.publishEvent(eventData);
      
      if (inviteId) {
        console.log(`Successfully created DAO invite ${inviteId}`);
        return inviteId;
      } else {
        throw new Error("Failed to publish invite event");
      }
    } catch (error) {
      console.error("Error creating DAO invite:", error);
      return null;
    }
  }
  
  /**
   * Create a kick proposal
   */
  async createKickProposal(
    daoId: string,
    title: string,
    description: string,
    options: string[],
    memberToKick: string,
    durationDays: number = 7
  ): Promise<string | null> {
    try {
      const pubkey = nostrService.publicKey;
      if (!pubkey) {
        throw new Error("User not authenticated");
      }
      
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        throw new Error("DAO not found");
      }
      
      // Check if the target is a member
      if (!dao.members.includes(memberToKick)) {
        throw new Error("Target is not a member of the DAO");
      }
      
      // Check if the target is the creator (who cannot be kicked)
      if (memberToKick === dao.creator) {
        throw new Error("The creator cannot be kicked from the DAO");
      }
      
      // Check if the initiator is a member
      if (!dao.members.includes(pubkey)) {
        throw new Error("Only members can propose kicks");
      }
      
      const now = Math.floor(Date.now() / 1000);
      const endsAt = now + (durationDays * 24 * 60 * 60); // Convert days to seconds
      
      // Prepare proposal data - include kick metadata
      const proposalData = {
        title,
        description,
        options,
        createdAt: now,
        endsAt: endsAt,
        type: "kick",
        targetPubkey: memberToKick
      };
      
      // Generate a unique identifier for the proposal
      const uniqueId = `kickproposal_${Math.random().toString(36).substring(2, 10)}`;
      
      // NIP-72 compliant proposal event with kick metadata
      const eventData = {
        kind: DAO_KINDS.PROPOSAL,
        content: JSON.stringify(proposalData),
        tags: [
          ["e", daoId], // Reference to DAO/community event
          ["d", uniqueId], // Unique identifier
          ["p", memberToKick, "kick"] // Tag the target user with kick action
        ]
      };
      
      console.log("Publishing kick proposal event:", eventData);
      
      const eventId = await nostrService.publishEvent(eventData);
      console.log("Kick proposal created with ID:", eventId);
      
      return eventId;
    } catch (error) {
      console.error("Error creating kick proposal:", error);
      return null;
    }
  }
  
  /**
   * Check if a kick proposal has passed (>51% voted yes)
   * and execute kick if necessary
   */
  async checkAndExecuteKickProposal(proposal: DAOProposal): Promise<boolean> {
    try {
      // Parse the proposal content to get kick metadata
      const content = JSON.parse(proposal.description);
      if (content.type !== "kick" || !content.targetPubkey) {
        return false; // Not a kick proposal
      }
      
      const memberToKick = content.targetPubkey;
      
      // Get total votes
      const totalVotes = Object.keys(proposal.votes).length;
      if (totalVotes === 0) return false;
      
      // Count yes votes (option 0)
      const yesVotes = Object.values(proposal.votes).filter(vote => vote === 0).length;
      
      // Calculate percentage
      const yesPercentage = (yesVotes / totalVotes) * 100;
      
      console.log(`Kick proposal for ${memberToKick}: ${yesPercentage}% voted yes`);
      
      // If >51% voted yes, execute the kick
      if (yesPercentage > 51) {
        console.log(`Executing kick for ${memberToKick}`);
        return await this.kickMember(proposal.daoId, memberToKick);
      }
      
      return false;
    } catch (error) {
      console.error("Error checking kick proposal:", error);
      return false;
    }
  }
  
  /**
   * Kick a member from the DAO
   */
  private async kickMember(daoId: string, memberToKick: string): Promise<boolean> {
    try {
      const dao = await this.getDAOById(daoId);
      if (!dao) return false;
      
      const pubkey = nostrService.publicKey;
      if (!pubkey) return false;
      
      // Only creator, moderators, or kick proposals can kick members
      const isCreatorOrMod = dao.creator === pubkey || dao.moderators.includes(pubkey);
      if (!isCreatorOrMod) {
        throw new Error("Not authorized to kick members");
      }
      
      // Check if target is a member and not the creator
      if (!dao.members.includes(memberToKick) || memberToKick === dao.creator) {
        return false;
      }
      
      // Get the unique identifier
      let uniqueId = daoId;
      const event = await this.getDAOEventById(daoId);
      if (event) {
        const dTag = event.tags.find(tag => tag[0] === 'd');
        if (dTag && dTag[1]) {
          uniqueId = dTag[1];
        }
      }
      
      // Create updated member list without kicked member
      const updatedMembers = dao.members.filter(member => member !== memberToKick);
      
      // Remove from moderators as well if applicable
      const updatedModerators = dao.moderators.filter(mod => mod !== memberToKick);
      
      // Create event to update DAO membership
      const eventData = {
        kind: DAO_KINDS.COMMUNITY,
        content: JSON.stringify({
          name: dao.name,
          description: dao.description,
          creator: dao.creator,
          createdAt: dao.createdAt,
          image: dao.image,
          guidelines: dao.guidelines,
          isPrivate: dao.isPrivate,
          treasury: dao.treasury,
          proposals: dao.proposals,
          activeProposals: dao.activeProposals,
          tags: dao.tags
        }),
        tags: [
          ["d", uniqueId],
          ...updatedMembers.map(member => ["p", member]),
          ...updatedModerators.map(mod => ["p", mod, "moderator"])
        ]
      };
      
      await nostrService.publishEvent(eventData);
      
      // Also publish a moderation event
      const moderationEvent = {
        kind: DAO_KINDS.MODERATION,
        content: JSON.stringify({
          action: "kick",
          target: memberToKick,
          reason: "Voted by DAO members",
          executedBy: pubkey,
          executedAt: Math.floor(Date.now() / 1000)
        }),
        tags: [
          ["e", daoId], // Reference to DAO
          ["p", memberToKick, "kicked"] // Target pubkey with action
        ]
      };
      
      await nostrService.publishEvent(moderationEvent);
      
      return true;
    } catch (error) {
      console.error("Error kicking member:", error);
      return false;
    }
  }
  
  /**
   * Get kick proposals for a DAO
   */
  async getDAOKickProposals(daoId: string): Promise<any[]> {
    try {
      // Check cache first
      const cachedKickProposals = daoCache.getKickProposals(daoId);
      if (cachedKickProposals) {
        console.log(`Using cached kick proposals for DAO: ${daoId}`);
        return cachedKickProposals;
      }
      
      // Use standard proposal fetching and filter for kick proposals
      const allProposals = await this.getDAOProposals(daoId);
      const kickProps = allProposals.filter(proposal => {
        try {
          const content = JSON.parse(proposal.description);
          return content.type === "kick" && content.targetPubkey;
        } catch (e) {
          return false;
        }
      }).map(proposal => {
        try {
          const content = JSON.parse(proposal.description);
          return {
            ...proposal,
            targetPubkey: content.targetPubkey
          };
        } catch (e) {
          return null;
        }
      }).filter(p => p !== null);
      
      // Cache the result
      daoCache.cacheKickProposals(daoId, kickProps);
      
      return kickProps;
    } catch (error) {
      console.error(`Error fetching kick proposals for DAO ${daoId}:`, error);
      return [];
    }
  }
  
  /**
   * Helper function to get the original DAO event
   */
  private async getDAOEventById(id: string): Promise<Event | null> {
    try {
      const filter: Filter = {
        ids: [id],
        kinds: [DAO_KINDS.COMMUNITY],
      };
      
      const events = await this.pool.querySync(this.relays, [filter]);
      return events.length > 0 ? events[0] : null;
    } catch (error) {
      console.error(`Error fetching DAO event ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Helper function to parse a DAO event - making it public for the hook to use
   */
  public parseDaoEvent(event: Event): DAO | null {
    try {
      console.log("Parsing DAO event:", event.id);
      
      // Parse the content with error handling
      let content: any = {};
      try {
        content = event.content ? JSON.parse(event.content) : {};
      } catch (e) {
        console.error("Error parsing DAO content JSON for event", event.id, e);
        content = {};
      }
      
      // Validate name - log issues with missing names
      const name = content.name?.trim();
      if (!name) {
        console.warn(`DAO event ${event.id} has no name or empty name. Content:`, content);
      }
      
      // Extract members from p tags
      const members = event.tags
        .filter(tag => tag.length >= 2 && tag[0] === 'p')
        .map(tag => tag[1]);
      
      // Extract moderators from p tags with role=moderator
      const moderators = event.tags
        .filter(tag => tag.length >= 3 && tag[0] === 'p' && tag[2] === 'moderator')
        .map(tag => tag[1]);
      
      // Construct DAO object
      const dao: DAO = {
        id: event.id,
        name: name || "Unnamed DAO",
        description: content.description || "",
        image: content.image || "",
        creator: event.pubkey,
        createdAt: event.created_at,
        members,
        moderators,
        guidelines: content.guidelines,
        isPrivate: content.isPrivate || false,
        treasury: content.treasury || {
          balance: 0,
          tokenSymbol: "ALPH"
        },
        proposals: content.proposals || 0,
        activeProposals: content.activeProposals || 0,
        tags: content.tags || []
      };
      
      return dao;
    } catch (e) {
      console.error("Error parsing DAO event:", e);
      return null;
    }
  }
  
  /**
   * Helper function to parse a proposal event - making it public for the hook to use
   */
  public parseProposalEvent(event: Event, daoId: string): DAOProposal | null {
    try {
      // Parse content with error handling
      let content: any = {};
      try {
        content = event.content ? JSON.parse(event.content) : {};
      } catch (e) {
        console.error("Error parsing proposal content JSON:", e);
        content = {};
      }
      
      // Calculate status based on end time
      const now = Math.floor(Date.now() / 1000);
      const status = content.endsAt > now ? "active" : "passed"; // Simple logic for now
      
      return {
        id: event.id,
        daoId: daoId,
        title: content.title || "Unnamed Proposal",
        description: content.description || "",
        options: content.options || ["Yes", "No"],
        createdAt: event.created_at,
        endsAt: content.endsAt || (event.created_at + 7 * 24 * 60 * 60), // Default 1 week
        creator: event.pubkey,
        votes: {},  // Will be filled later
        status
      };
    } catch (e) {
      console.error("Error parsing proposal event:", e);
      return null;
    }
  }
  
  /**
   * Gets proposals - added as alias for useDAO hook compatibility
   */
  public getProposals(daoId: string): DAOProposal[] | null {
    return daoCache.getProposals(daoId);
  }
}

export const daoService = new DAOService();
